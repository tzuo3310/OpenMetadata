/*
 *  Copyright 2026 Collate.
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *  http://www.apache.org/licenses/LICENSE-2.0
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

import Fqn from './Fqn';

describe('Fqn', () => {
  describe('split', () => {
    it('should split a fully qualified name into its parts', () => {
      expect(Fqn.split('service.database.schema.table')).toEqual([
        'service',
        'database',
        'schema',
        'table',
      ]);
    });

    it('should return no parts for an empty name without logging a parser error', () => {
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => undefined);

      expect(Fqn.split('')).toEqual([]);
      expect(consoleErrorSpy).not.toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });
});
