#  Copyright 2025 Collate
#  Licensed under the Collate Community License, Version 1.0 (the "License");
#  you may not use this file except in compliance with the License.
#  You may obtain a copy of the License at
#  https://github.com/open-metadata/OpenMetadata/blob/main/ingestion/LICENSE
#  Unless required by applicable law or agreed to in writing, software
#  distributed under the License is distributed on an "AS IS" BASIS,
#  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#  See the License for the specific language governing permissions and
#  limitations under the License.
"""
Mixin class for sending progress updates and operation metrics to OpenMetadata server.
"""

import time
from typing import Optional

from metadata.generated.schema.entity.services.ingestionPipelines.operationMetrics import (
    OperationMetricsBatch,
)
from metadata.generated.schema.entity.services.ingestionPipelines.progressUpdate import (
    ProgressUpdate,
)
from metadata.ingestion.ometa.client import REST
from metadata.utils.logger import ometa_logger

logger = ometa_logger()

RESPONSE_BODY_LOG_LIMIT = 500


def error_detail(exc: Exception) -> str:
    """Truncated server response body for a failed request, empty when unavailable."""
    body = getattr(getattr(exc, "response", None), "text", None)
    if not body:
        return ""
    return f" - response: {body.strip()[:RESPONSE_BODY_LOG_LIMIT]}"


class OMetaProgressMixin:
    """
    Mixin for OpenMetadata API client to send progress updates and operation metrics.

    This mixin extends the OpenMetadata client with methods to:
    - Send real-time progress updates during ingestion
    - Submit batches of operation metrics (db queries, API calls, etc.)
    """

    client: REST

    def send_progress_update(self, pipeline_fqn: str, run_id: str, update: ProgressUpdate) -> None:
        """
        Send a progress update to the OpenMetadata server.

        The closing update of a run (PIPELINE_COMPLETE / ERROR) is the signal the
        UI relies on to stop rendering the live "in progress" progress bar. A
        single dropped request would leave the UI stuck on the last percentage,
        so this retries a few times before giving up.

        Args:
            pipeline_fqn: Fully qualified name of the ingestion pipeline
            run_id: UUID of the current pipeline run
            update: ProgressUpdate object with current progress state
        """
        encoded_fqn = pipeline_fqn.replace("/", "%2F")
        payload = update.model_dump_json(exclude_none=True)
        for attempt in range(1, 4):
            try:
                self.client.put(
                    f"/services/ingestionPipelines/progress/{encoded_fqn}/{run_id}",
                    payload,
                )
                return
            except Exception as exc:
                logger.debug(
                    "Failed to send progress update (attempt %s/3): %s%s",
                    attempt,
                    exc,
                    error_detail(exc),
                )
                if attempt < 3:
                    time.sleep(min(2 * attempt, 6))
        logger.warning("Gave up sending progress update for run %s after 3 attempts", run_id)

    def send_operation_metrics_batch(self, pipeline_fqn: str, run_id: str, batch: OperationMetricsBatch) -> None:
        """
        Send a batch of operation metrics to the OpenMetadata server.

        Args:
            pipeline_fqn: Fully qualified name of the ingestion pipeline
            run_id: UUID of the current pipeline run
            batch: OperationMetricsBatch containing collected metrics
        """
        try:
            encoded_fqn = pipeline_fqn.replace("/", "%2F")
            self.client.post(
                f"/services/ingestionPipelines/metrics/{encoded_fqn}/{run_id}",
                batch.model_dump_json(exclude_none=True),
            )
        except Exception as exc:
            logger.debug("Failed to send operation metrics batch: %s%s", exc, error_detail(exc))

    def get_progress_state(self, pipeline_fqn: str, run_id: str) -> Optional[ProgressUpdate]:  # noqa: UP045
        """
        Get the current progress state for a pipeline run.

        Args:
            pipeline_fqn: Fully qualified name of the ingestion pipeline
            run_id: UUID of the current pipeline run

        Returns:
            ProgressUpdate object if available, None otherwise
        """
        try:
            encoded_fqn = pipeline_fqn.replace("/", "%2F")
            response = self.client._request(
                "GET",
                f"/services/ingestionPipelines/progress/{encoded_fqn}/{run_id}",
            )
            if response:
                return ProgressUpdate.model_validate(response)
            return None  # noqa: TRY300
        except Exception as exc:
            logger.debug("Failed to get progress state: %s%s", exc, error_detail(exc))
            return None
