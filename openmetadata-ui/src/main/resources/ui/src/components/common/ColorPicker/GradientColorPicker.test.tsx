/*
 *  Copyright 2026 Collate.
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "as IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */
import { fireEvent, render, screen } from '@testing-library/react';
import GradientColorPicker from './GradientColorPicker';

describe('GradientColorPicker', () => {
  it('renders the legacy color testids for a field id', () => {
    render(
      <GradientColorPicker
        id="primaryColor"
        value="#1570ef"
        onChange={jest.fn()}
      />
    );

    expect(screen.getByTestId('primaryColor-color-input')).toBeInTheDocument();
    expect(screen.getByTestId('primaryColor-color-picker')).toBeInTheDocument();
  });

  it('emits a solid hex when the hex input receives a hex', () => {
    const onChange = jest.fn();
    render(
      <GradientColorPicker
        id="primaryColor"
        value="#1570ef"
        onChange={onChange}
      />
    );
    fireEvent.change(screen.getByTestId('primaryColor-color-input'), {
      target: { value: '#ffffff' },
    });

    expect(onChange).toHaveBeenCalledWith('#ffffff');
  });

  it('emits a linear-gradient when the two stops differ', () => {
    const onChange = jest.fn();
    render(
      <GradientColorPicker
        id="primaryColor"
        value="#1570ef"
        onChange={onChange}
      />
    );
    fireEvent.change(screen.getByTestId('primaryColor-color-to'), {
      target: { value: '#175cd3' },
    });

    expect(onChange).toHaveBeenCalledWith(
      'linear-gradient(135deg, #1570ef 0%, #175cd3 100%)'
    );
  });

  it('emits a gradient with the updated from stop', () => {
    const onChange = jest.fn();
    render(
      <GradientColorPicker
        id="primaryColor"
        value="#1570ef"
        onChange={onChange}
      />
    );
    fireEvent.change(screen.getByTestId('primaryColor-color-picker'), {
      target: { value: '#175cd3' },
    });

    expect(onChange).toHaveBeenCalledWith(
      'linear-gradient(135deg, #175cd3 0%, #1570ef 100%)'
    );
  });

  it('round-trips an existing gradient value', () => {
    const onChange = jest.fn();
    render(
      <GradientColorPicker
        id="primaryColor"
        value="linear-gradient(90deg, #1570ef 0%, #175cd3 100%)"
        onChange={onChange}
      />
    );
    fireEvent.change(screen.getByTestId('primaryColor-color-to'), {
      target: { value: '#0ea5e9' },
    });

    expect(onChange).toHaveBeenCalledWith(
      'linear-gradient(90deg, #1570ef 0%, #0ea5e9 100%)'
    );
  });
});
