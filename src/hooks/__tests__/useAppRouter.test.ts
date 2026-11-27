import { describe, expect, it } from 'vitest';
import { parseAppRoute } from '../useAppRouter';

describe('parseAppRoute', () => {
  it('memetakan root dan rute utama dengan benar', () => {
    expect(parseAppRoute('/')).toEqual({ path: '/' });
    expect(parseAppRoute('/lobby')).toEqual({ path: '/lobby' });
    expect(parseAppRoute('/lobby/')).toEqual({ path: '/lobby' });
    expect(parseAppRoute('/panduan')).toEqual({ path: '/panduan' });
    expect(parseAppRoute('/guide')).toEqual({ path: '/panduan' });
    expect(parseAppRoute('/statistik')).toEqual({ path: '/statistik' });
    expect(parseAppRoute('/stats')).toEqual({ path: '/statistik' });
    expect(parseAppRoute('/log')).toEqual({ path: '/log' });
    expect(parseAppRoute('/dagang')).toEqual({ path: '/dagang' });
  });

  it('mengekstrak roomCode dari /lobby/:code dalam huruf kapital', () => {
    expect(parseAppRoute('/lobby/ab12cd')).toEqual({
      path: '/lobby',
      roomCode: 'AB12CD',
    });
  });

  it('mengembalikan root untuk path yang tidak dikenal', () => {
    expect(parseAppRoute('/tidak-ada')).toEqual({ path: '/' });
  });
});
