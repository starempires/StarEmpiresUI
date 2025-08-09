import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Stage } from 'react-konva';
import Galaxy from '../components/galaxy/Galaxy';
import InfoPane from '../components/panels/InfoPane';
import OrdersPane from '../components/panels/OrdersPane';
import MapPageSubHeader from '../components/panels/MapPageSubHeader';
import * as Constants from '../Constants';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import {
  PanelGroup,
  Panel,
  PanelResizeHandle
} from 'react-resizable-panels';
import { loadSnapshot } from '../components/common/SessionAPI';

type CustomKonvaEventObject<T extends Event> = {
  evt: T;
};

interface MapPageParams {
  sessionName: string;
  empireName: string;
  turnNumber: string;
  [key: string]: string | undefined;
}

export default function MapPage() {

  const { sessionName, empireName, turnNumber } = useParams<MapPageParams>();
  const [snapshot, setSnapshot] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedSectorText, setSelectedSectorText] = useState<string>("");

    useEffect(() => {
      async function loadTurnShapshot() {
         try {
            const snapshot = await loadSnapshot(sessionName!, empireName!, Number(turnNumber!));
            setSnapshot(snapshot);
//             console.log("set snapshot to " + JSON.stringify(snapshot));
         } catch (error) {
            console.error("Error loading snapshot:", error);
         } finally {
            setLoading(false);
         }
      }
      loadTurnShapshot();
    }, [sessionName, empireName, turnNumber]);

  const handleDoubleClick = (event: CustomKonvaEventObject<MouseEvent>) => {
    event.evt.preventDefault();
//     setIsOpen(!isOpen);
  };

  const handleClick = (event: CustomKonvaEventObject<MouseEvent>, hoverText: string) => {
    event.evt.preventDefault();
    setSelectedSectorText(hoverText);
//     console.log("left click (button " + event.evt.button + ") = " + sectorData.oblique + ", " + sectorData.y);
//     console.log("left click hover text = " + hoverText);
  };

    if (loading) {
        return <Typography variant="h6" sx={{ ml: 5 }}>Loading...</Typography>;
    }

    // Ensure snapshot is available before rendering
    if (!snapshot) {
        return <Typography variant="h6" sx={{ ml: 5, color: "red" }}>Error loading snapshot.</Typography>;
    }

   // width, height enough room for hover text
   // TODO: revisit this for a better computation
   const width = (snapshot.radius * 8) * Constants.RADIUS;
   const height = (snapshot.radius * 6) * Constants.RADIUS;

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <MapPageSubHeader sessionName={sessionName!} empireName={empireName!} turnNumber={Number(turnNumber!)} />

      {/* Main split panes fill the remaining viewport height */}
      <Box sx={{ flex: 1, minHeight: 0 }}>
        <PanelGroup direction="horizontal" style={{ height: '95%' }}>
          {/* Left Pane: Galaxy Map (scrollable if Stage is taller than the container) */}
          <Panel defaultSize={50} minSize={25} maxSize={95}>
            <Box sx={{ ml: 2, height: '100%', overflow: 'auto' }}>
              <Stage width={width} height={height}>
                <Galaxy turnData={snapshot} onDblClick={handleDoubleClick} onClick={handleClick} />
              </Stage>
            </Box>
          </Panel>

          <PanelResizeHandle className="w-3 bg-blue-800 hover:bg-blue-600" style={{ cursor: 'col-resize', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Box sx={{
              width: '4px',
              height: '30px',
              backgroundColor: 'white',
              borderRadius: '2px',
            }} />
          </PanelResizeHandle>

          {/* Right Pane: Sector details and orders – fills full height */}
          <Panel defaultSize={50}>
            {empireName === 'GM' ? (
              <Box sx={{ ml: 5, width: '100%', height: '90%', overflow: 'auto' }}>
                <InfoPane infoText={selectedSectorText} />
              </Box>
            ) : (
              <PanelGroup direction="vertical" style={{ height: '95%' }}>
                <Panel defaultSize={50}>
                  <Box sx={{ height: '100%', overflow: 'auto' }}>
                    <InfoPane infoText={selectedSectorText} />
                  </Box>
                </Panel>
                <PanelResizeHandle className="h-3 bg-blue-800 hover:bg-blue-600" style={{ cursor: 'row-resize', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Box sx={{
                    width: '30px',
                    height: '4px',
                    backgroundColor: 'white',
                    borderRadius: '2px',
                  }} />
                </PanelResizeHandle>
                <Panel defaultSize={50}>
                  <Box sx={{ height: '100%', overflow: 'auto' }}>
                    <OrdersPane
                      sessionName={sessionName!}
                      empireName={empireName!}
                      turnNumber={Number(turnNumber)}
                    />
                  </Box>
                </Panel>
              </PanelGroup>
            )}
          </Panel>
        </PanelGroup>
      </Box>
    </Box>
  );
}