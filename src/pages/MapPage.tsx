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
import { SplitPane } from "react-collapse-pane";

type CustomKonvaEventObject<T extends Event> = {
  evt: T;
  // Add any additional properties if needed
};

export default function MapPage({ signOut, userAttributes }: { signOut: () => void; userAttributes: any }) {

  const { sessionName, empireName, turnNumber } = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [entryText, setEntryText] = useState<string>("");
  const [selectedSectorText, setSelectedSectorText] = useState<string>("");

    useEffect(() => {
      // Define an async function to call the API
      const fetchSessionObject = async () => {
        try {
          const response = await fetch("https://api.starempires.com/getSessionObject", {
            method: "POST",
            headers: {
              "Authorization": "Bearer REAL_JWT_TOKEN",
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              sessionName: sessionName,
              empireName: empireName,
              turnNumber: turnNumber,
              sessionObject: "SNAPSHOT"
            })
          });
          const apiData = await response.json();
          setData(apiData);
        } catch (error) {
          console.error("Error fetching data:", error);
        } finally {
          setLoading(false);
        }
      };

      fetchSessionObject();
    }, []);

  const handleDoubleClick = (event: CustomKonvaEventObject<MouseEvent>) => {
    event.evt.preventDefault();
//     setIsOpen(!isOpen);
  };

  const handleClick = (event: CustomKonvaEventObject<MouseEvent>, sectorData: any, hoverText: string) => {
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
          <Typography variant="h6" gutterBottom sx={{ ml: 5, color: data.colors["visible"] }}>
            Welcome, {userAttributes?.preferred_username}
            <button onClick={signOut}>Sign out</button>
          </Typography>
          <Typography variant="h6" gutterBottom sx={{ ml: 5, color: data.colors["visible"] }}>
            {data.name} galactic map for session {data.session}, turn {data.turnNumber}
          </Typography>
      <Grid container spacing={2}>
        {/* Left Pane: Galaxy Map */}
        <SplitPane split="vertical" collapse={true} initialSizes={[1.5,1]} minSizes={[300, 300]} >
        <Grid item xs={true}>
          <Box sx={{ ml: 5 }}>
            <Stage width={width} height={height}>
              <Galaxy turnData={data} onDblClick={handleDoubleClick} onClick={handleClick} />
            </Stage>
          </Box>
        </Grid>
        {/* Right Pane: Two stacked panes */}
        <Grid item xs={4}>
          <Grid container direction="column" spacing={2}>
            {/* Top Right Pane: Display Selected Sector Data */}
            <SplitPane split="horizontal" collapse={true}  minSizes={[150, 250]}>
            <Grid item xs={true}>
              <InfoPane infoText={selectedSectorText}/>
            </Grid>
            {/* Bottom Right Pane: Text Entry for Orders */}
            <Grid item xs={true}>
              <OrdersPane entryText={entryText}
                          onEntryChange={setEntryText}
                          onSubmit ={() => { console.log("Submitting orders");
               }}/>
            </Grid>
            </SplitPane>
          </Grid>
        </Grid>
      </SplitPane>
      </Grid>
    </div>
    );
}