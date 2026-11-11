import { parseBackup, BACKUP_FORMAT } from './backup';

jest.mock('./client', () => ({ getDb: jest.fn(), clearDataTables: jest.fn() }));
jest.mock('./dataVersion', () => ({ bumpDataVersion: jest.fn() }));

describe('backup.parseBackup', () => {
  test('accepte un fichier valide', () => {
    const b = parseBackup(
      JSON.stringify({
        format: BACKUP_FORMAT,
        version: 1,
        data: { persons: [], categories: [], expenses: [] },
      }),
    );
    expect(b).not.toBeNull();
    expect(b!.data.recurringExpenses).toEqual([]);
  });
  test('refuse un format inconnu ou une version future', () => {
    expect(parseBackup('{"format":"x"}')).toBeNull();
    expect(
      parseBackup(
        JSON.stringify({
          format: BACKUP_FORMAT,
          version: 99,
          data: { persons: [], categories: [], expenses: [] },
        }),
      ),
    ).toBeNull();
    expect(parseBackup('pas du json')).toBeNull();
  });
});
