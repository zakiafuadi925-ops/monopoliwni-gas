/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GameProvider } from './context/GameContext';
import { GameContent } from './components/GameContent';

export default function App() {
  return (
    <GameProvider>
      <GameContent />
    </GameProvider>
  );
}
