export interface Empire {
  name: string;
  empireType: string;
  sessionName: string;
  orderStatus: string;
}

export interface SessionEmpires {
  sessionName: string;
  sessionId: string;
  currentTurnNumber: number;
  deadline: string;
  empires: Empire[];
}