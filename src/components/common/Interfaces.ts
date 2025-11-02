export interface Empire {
  name: string;
  playerName: string;
  empireType: string;
  sessionName: string;
  orderStatus: string;
}

export interface SessionEmpires {
  sessionName: string;
  gmPlayerName: string;
  sessionId: string;
  currentTurnNumber: number;
  currentPlayerIsGM: boolean;
  numPlayers: number;
  deadline: string;
  status: string;
  empires: Empire[];
}