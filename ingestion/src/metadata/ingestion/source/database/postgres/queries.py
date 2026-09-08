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
SQL Queries used during ingestion
"""

import textwrap

POSTGRES_SQL_STATEMENT = textwrap.dedent(
    """
      SELECT
        u.usename,
        d.datname database_name,
        s.query query_text,
        s.{time_column_name} duration
      FROM
        {query_statement_source} s
        JOIN pg_catalog.pg_database d ON s.dbid = d.oid
        JOIN pg_catalog.pg_user u ON s.userid = u.usesysid
      WHERE
        s.query NOT LIKE '/* {{"app": "OpenMetadata", %%}} */%%' AND
        s.query NOT LIKE '/* {{"app": "dbt", %%}} */%%'
        {filters}
      LIMIT {result_limit}
    """
)

# https://www.postgresql.org/docs/current/catalog-pg-class.html
# r = ordinary table, v = view, m = materialized view, c = composite type, f = foreign table, p = partitioned table,
# PATCHED for PG 9.2: removed `relispartition` (PG 10+); `'p'` in relkind is harmless in 9.2 (won't match).
POSTGRES_GET_TABLE_NAMES = """
    SELECT c.relname, c.relkind FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = :schema AND c.relkind in ('r', 'p', 'f')
"""
POSTGRES_TABLE_OWNERS = """
select schemaname, tablename, tableowner from pg_catalog.pg_tables where schemaname <> 'pg_catalog' order by schemaname,tablename;
"""
# PATCHED for PG 9.2: native partitioning (pg_partitioned_table / partstrat / partattrs)
# does not exist. Return 0 rows. The :table_name / :schema_name placeholders are kept
# (referenced in WHERE) so the caller's bind params are consumed and SQLAlchemy does
# not raise "Unexpected parameter".
POSTGRES_PARTITION_DETAILS = textwrap.dedent(
    """
    select
        NULL::text as schema,
        NULL::text as table_name,
        NULL::text as partition_strategy,
        NULL::text as column_name
    where
        :table_name = :table_name and :schema_name = :schema_name and 1=0
    """
)

# PATCHED for PG 9.2: pg_policy (RLS policies) was introduced in PG 9.5; 9.2 has none.
# Return 0 rows. The .format() placeholders {database_name}/{schema_name} are placed
# inside a comment so .format() still finds them without injecting values into SQL.
POSTGRES_GET_ALL_TABLE_PG_POLICY = """
/* placeholders: {database_name} {schema_name} */
SELECT NULL::int as object_id, NULL::text as polname, NULL::text as table_catalog, NULL::text as table_schema, NULL::text as table_name
WHERE 1=0
"""  # noqa: W291

POSTGRES_SCHEMA_COMMENTS = """
    SELECT n.nspname AS schema_name, 
            d.description AS comment
    FROM pg_catalog.pg_namespace n
    LEFT JOIN pg_catalog.pg_description d ON d.objoid = n.oid AND d.objsubid = 0;
"""  # noqa: W291

POSTGRES_TABLE_COMMENTS = """
    SELECT n.nspname as schema,
            c.relname as table_name,
            pgd.description as table_comment
    FROM pg_catalog.pg_class c
        LEFT JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
        LEFT JOIN pg_catalog.pg_description pgd ON pgd.objsubid = 0 AND pgd.objoid = c.oid
    WHERE c.relkind in ('r', 'v', 'm', 'f', 'p')
      AND pgd.description IS NOT NULL
      AND n.nspname <> 'pg_catalog'
    ORDER BY "schema", "table_name"
"""

# Postgres views definitions only contains the select query
# hence we are appending "create view <schema>.<table> as " to select query
# to generate the column level lineage
POSTGRES_VIEW_DEFINITIONS = """
SELECT 
	n.nspname "schema",
	c.relname view_name,
	'create view ' || n.nspname || '.' || c.relname || ' as ' || pg_get_viewdef(c.oid,true) view_def
FROM pg_class c 
JOIN pg_namespace n ON n.oid = c.relnamespace 
WHERE c.relkind IN ('v', 'm')
AND n.nspname not in ('pg_catalog','information_schema')
"""  # noqa: W291

POSTGRES_GET_DATABASE = """
select datname from pg_catalog.pg_database
"""

# PATCHED for PG 9.2: pg_policy does not exist. Return 0 rows so the connection
# test step for GetTags passes (no exception) and features are treated as N/A.
POSTGRES_TEST_GET_TAGS = """
SELECT NULL::int as object_id, NULL::text as polname, NULL::text as table_catalog, NULL::text as table_schema, NULL::text as table_name WHERE 1=0
"""  # noqa: W291

POSTGRES_TEST_GET_QUERIES = """
      SELECT
        u.usename,
        d.datname database_name,
        s.query query_text,
        s.{time_column_name} duration
      FROM
        {query_statement_source} s
        JOIN pg_catalog.pg_database d ON s.dbid = d.oid
        JOIN pg_catalog.pg_user u ON s.userid = u.usesysid
      LIMIT 1
    """


POSTGRES_GET_DB_NAMES = """
select datname from pg_catalog.pg_database
"""

POSTGRES_COL_IDENTITY = """\
  (SELECT json_build_object(
      'always', a.attidentity = 'a',
      'start', s.seqstart,
      'increment', s.seqincrement,
      'minvalue', s.seqmin,
      'maxvalue', s.seqmax,
      'cache', s.seqcache,
      'cycle', s.seqcycle)
  FROM pg_catalog.pg_sequence s
  JOIN pg_catalog.pg_class c on s.seqrelid = c."oid"
  WHERE c.relkind = 'S'
  AND a.attidentity != ''
  AND s.seqrelid = pg_catalog.pg_get_serial_sequence(
      a.attrelid::regclass::text, a.attname
  )::regclass::oid
  ) as identity_options\
"""

POSTGRES_SQL_COLUMNS = """
        SELECT a.attname,
            pg_catalog.format_type(a.atttypid, a.atttypmod),
            (
            SELECT pg_catalog.pg_get_expr(d.adbin, d.adrelid)
            FROM pg_catalog.pg_attrdef d
            WHERE d.adrelid = a.attrelid AND d.adnum = a.attnum
            AND a.atthasdef
            ) AS DEFAULT,
            a.attnotnull,
            a.attrelid as table_oid,
            pgd.description as comment,
            {generated},
            {identity}
        FROM pg_catalog.pg_attribute a
        LEFT JOIN pg_catalog.pg_description pgd ON (
            pgd.objoid = a.attrelid AND pgd.objsubid = a.attnum)
        WHERE a.attrelid = :table_oid
        AND a.attnum > 0 AND NOT a.attisdropped
        ORDER BY a.attnum
    """

POSTGRES_GET_SERVER_VERSION = """
show server_version_num
"""

# pylint: disable=anomalous-backslash-in-string
POSTGRES_GET_SCHEMA_NAMES = """
SELECT nspname FROM pg_namespace
    WHERE nspname NOT LIKE 'pg\_%'
    ORDER BY nspname
"""  # noqa: W605

POSTGRES_FETCH_FK = """
    SELECT r.conname,
        pg_catalog.pg_get_constraintdef(r.oid, true) as condef,
        n.nspname as conschema,
        d.datname AS con_db_name
    FROM  pg_catalog.pg_constraint r,
        pg_namespace n,
        pg_class c
    JOIN pg_database d ON d.datname = current_database()
    WHERE r.conrelid = :table AND
        r.contype = 'f' AND
        c.oid = confrelid AND
        n.oid = c.relnamespace
    ORDER BY 1
"""

# PATCHED for PG 9.2: `prokind` column (PG 11+) does not exist. PG 9.2 has no
# "stored procedure" concept (only functions via CREATE FUNCTION), so return 0 rows.
POSTGRES_GET_STORED_PROCEDURES = """
    SELECT proname AS procedure_name,
        nspname AS schema_name,
        proargtypes AS argument_types,
        prorettype::regtype AS return_type,
        prosrc AS definition,
        'StoredProcedure' as procedure_type,
        obj_description(pg_proc.oid, 'pg_proc') AS description
    FROM pg_proc
    JOIN pg_namespace ON pg_proc.pronamespace = pg_namespace.oid
    WHERE 1=0
    and pg_namespace.nspname = '{schema_name}';
"""

# PATCHED for PG 9.2: replace `prokind = 'f'` (PG 11+) with the PG 9.2 equivalent
# `proisagg = false AND proiswindow = false` to keep "regular functions only".
POSTGRES_GET_FUNCTIONS = """
SELECT
    proname AS procedure_name,
    nspname AS schema_name,
    proargtypes AS argument_types,
    prorettype :: regtype AS return_type,
    prosrc AS definition,
    'Function' as procedure_type,
    obj_description(pg_proc.oid, 'pg_proc') AS description
FROM
    pg_proc
    JOIN pg_namespace ON pg_proc.pronamespace = pg_namespace.oid
WHERE
    proisagg = false AND proiswindow = false
    and pg_namespace.nspname = '{schema_name}';
"""

TEST_COLUMN_METADATA = """
SELECT COUNT(*) as count
FROM pg_catalog.pg_attribute a
LEFT JOIN pg_catalog.pg_description pgd ON (
    pgd.objoid = a.attrelid AND pgd.objsubid = a.attnum)
WHERE 1=0
"""

TEST_TABLE_COMMENTS = """
SELECT COUNT(*) as count
FROM pg_catalog.pg_class c
LEFT JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
LEFT JOIN pg_catalog.pg_description pgd ON pgd.objsubid = 0 AND pgd.objoid = c.oid
WHERE 1=0
"""

TEST_INFORMATION_SCHEMA_COLUMNS = """
SELECT COUNT(*) as count
FROM information_schema.columns
WHERE 1=0
"""
