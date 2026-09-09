/*
 *  Copyright 2026 Collate.
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */
import { Input, InputNumber, Space } from 'antd';
import { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { parseColorValue, toColorValue } from '../../../utils/ColorUtils';

export interface GradientColorPickerProps {
  id?: string;
  value?: string;
  onChange?: (value: string) => void;
}

/**
 * Color picker that lets a theme color be either a solid hex or a two-stop
 * linear gradient. The stored value stays a single string (hex, or
 * `linear-gradient(...)`) so the backend schema is unchanged and legacy hex
 * configs keep working.
 *
 * `data-testid` mirrors the legacy ColorPicker (`{id}-color-input` /
 * `{id}-color-picker`) so existing form tests keep passing.
 */
const GradientColorPicker: FC<GradientColorPickerProps> = ({
  id,
  value,
  onChange,
}) => {
  const { t } = useTranslation();
  const { from, to, angle } = parseColorValue(value);

  const emit = (nextFrom: string, nextTo: string, nextAngle: number) => {
    onChange?.(toColorValue(nextFrom, nextTo, nextAngle));
  };

  return (
    <Space
      className="gradient-color-picker"
      direction="vertical"
      size={4}
      style={{ width: '100%' }}>
      <Space wrap size={8}>
        <Input
          aria-label="from-color"
          data-testid={id ? `${id}-color-picker` : 'color-picker'}
          type="color"
          value={from}
          onChange={(e) => emit(e.target.value, to, angle)}
        />
        <Input
          aria-label="to-color"
          data-testid={id ? `${id}-color-to` : 'color-to'}
          type="color"
          value={to}
          onChange={(e) => emit(from, e.target.value, angle)}
        />
        <InputNumber
          addonAfter="°"
          aria-label="gradient-angle"
          data-testid={id ? `${id}-color-angle` : 'color-angle'}
          max={360}
          min={0}
          style={{ width: 110 }}
          value={angle}
          onChange={(val) => emit(from, to, Number(val) || 0)}
        />
      </Space>
      <Input
        aria-label="hex-or-gradient"
        data-testid={id ? `${id}-color-input` : 'color-input'}
        placeholder={t('message.hex-code-placeholder')}
        value={value ?? ''}
        onChange={(e) => emit(e.target.value, e.target.value, angle)}
      />
    </Space>
  );
};

export default GradientColorPicker;
