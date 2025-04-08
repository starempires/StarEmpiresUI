import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Stage } from 'react-konva';
import Galaxy from '../components/galaxy/Galaxy';
import InfoPane from '../components/panels/InfoPane';
import OrdersPane from '../components/panels/OrdersPane';
import * as Constants from '../Constants';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { SplitPane } from 'react-collapse-pane';
import { fetchSessionObject } from '../components/common/SessionAPI';

type CustomKonvaEventObject<T extends Event> = {
  evt: T;
};

export default function MapPage() {

  const { sessionName, empireName, turnNumber } = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSectorText, setSelectedSectorText] = useState<string>("");

    useEffect(() => {
      async function loadSnapshot() {
         try {
            const apiData = await fetchSessionObject(
                  sessionName ?? "",
                  empireName ?? "",
                  Number(turnNumber),
                  "SNAPSHOT"
            );
            const json = JSON.parse(apiData);
            setData(json.data);
         } catch (error) {
            console.error("Error loading snapshot:", error);
         } finally {
            setLoading(false);
         }
      }
      loadSnapshot();
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

    // Ensure data is available before rendering
    if (!data) {
        return <Typography variant="h6" sx={{ ml: 5, color: "red" }}>Error loading data.</Typography>;
    }

   // width, height enough room for hover text
   // TODO: revisit this for a better computation
   const width = (data.radius * 8) * Constants.RADIUS;
   const height = (data.radius * 6) * Constants.RADIUS;

    return (
    <div>
          <Typography variant="h6" gutterBottom sx={{ ml: 3, color: data.colors["visible"] }}>
            {data.name} galactic map for session {data.session}, turn {data.turnNumber}
          </Typography>
      <Grid container spacing={2}>
        {/* Left Pane: Galaxy Map */}
        <SplitPane split="vertical" collapse={true} initialSizes={[1.5,1]} minSizes={[300, 300]} >
        <Grid item xs={true}>
          <Box sx={{ ml: 2 }}>
            <Stage width={width} height={height}>
              <Galaxy turnData={data} onDblClick={handleDoubleClick} onClick={handleClick} />
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