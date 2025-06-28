import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Stage } from 'react-konva';
import Galaxy from '../components/galaxy/Galaxy';
import InfoPane from '../components/panels/InfoPane';
import OrdersPane from '../components/panels/OrdersPane';
import MapPageSubHeader from '../components/panels/MapPageSubHeader';
import * as Constants from '../Constants';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { SplitPane } from 'react-collapse-pane';
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
    <div>
      <MapPageSubHeader sessionName={sessionName!} empireName={empireName!} turnNumber={Number(turnNumber!)} />
      <Grid container spacing={2}>
        {/* Left Pane: Galaxy Map */}
        <SplitPane split="vertical" collapse={true} initialSizes={[1.5,1]} minSizes={[300, 300]} >
        <Grid item xs={true}>
          <Box sx={{ ml: 2 }}>
            <Stage width={width} height={height}>
              <Galaxy turnData={snapshot} onDblClick={handleDoubleClick} onClick={handleClick} />
            </Stage>
          </Box>
        </Grid>
                {/* Right Pane: Always show InfoPane; if not GM, show OrdersPane in a vertical split */}
                <Grid item xs={4}>
                  {empireName === "GM" ? (
                    <Box sx={{ ml: 5, width: "100%" }}>
                      <InfoPane infoText={selectedSectorText} />
                    </Box>
                  ) : (
                    <Grid container direction="column" spacing={2}>
                      <SplitPane split="horizontal" collapse={true} minSizes={[150, 250]}>
                        <Grid item xs={true}>
                          <InfoPane infoText={selectedSectorText} />
                        </Grid>
                        <Grid item xs={true}>
                          <OrdersPane
                            sessionName={sessionName!}
                            empireName={empireName!}
                            turnNumber={Number(turnNumber)}
                          />
                        </Grid>
                      </SplitPane>
                    </Grid>
                  )}
                </Grid>
      </SplitPane>
      </Grid>
    </div>
    );
}