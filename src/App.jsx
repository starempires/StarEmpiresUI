import React, { Component } from 'react';
import { Stage } from 'react-konva';
import Galaxy from './components/galaxy/Galaxy.jsx';
import * as Constants from './Constants';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

//const TURNDATA = require("./snapshot.json");

export default class App extends Component {

  constructor(props) {
     super(props);
//     console.log("r = " + TURNDATA.radius);
     this.handleDoubleClick = this.handleDoubleClick.bind(this);
     this.handleClick = this.handleClick.bind(this);
     this.handleOnTabChange = this.handleOnTabChange.bind(this);
     this.state = {isOpen:false, tabIndex:0, sectorData: null};
  }

  componentDidMount() {
          fetch("https://api.starempires.com/getSessionObject", {
              method: "POST",
              headers: {
//                  "Authorization": "Bearer REAL_JWT_TOKEN",
                  "Content-Type": "application/json"
              },
              body: JSON.stringify({ sessionName: "alpha", empireName: "GM", turnNumber: 0, sessionObject: "SNAPSHOT" })
          })
          .then(response => response.json())
          .then(apiData => {
              this.setState({ data: apiData, loading: false });
          })
          .catch(error => {
              console.error("Error fetching data:", error);
              this.setState({ loading: false });
          });
      }

  handleDoubleClick(event) {
     event.evt.preventDefault();
     this.setState({ isOpen: !this.state.isOpen });
  }

   handleClick(event, sectorData)
   {
       event.evt.preventDefault(true);
       this.setState({sectorData: sectorData});
       console.log("left click (button " + event.evt.button + ") = " + sectorData.oblique + "," + sectorData.y);
    }

  handleOnTabChange(event, value)
  {
//    console.log("clicked tab v=" + value);
    this.setState({tabIndex: value});
  }

  render() {
//   console.log("size = " + size);
    const { data, loading } = this.state;

    if (loading) {
        return <Typography variant="h6" sx={{ ml: 5 }}>Loading...</Typography>;
    }

    // Ensure data is available before rendering
    if (!data) {
        return <Typography variant="h6" sx={{ ml: 5, color: "red" }}>Error loading data.</Typography>;
    }

   const size = data.radius * 10 * Constants.RADIUS;

    return (
      <div>
        <Grid container spacing={2}>
          <Grid item xs={10}>
            <Typography variant="h6" gutterBottom gutterLeft sx={{ ml:5, color: data.colors["visible"] }}>
                  {data.name} galactic map for session {data.session}, turn {data.turnNumber}
            </Typography>
            <Box sx={{ ml: 5 }}>
              <Stage width={size} height={size}>
                <Galaxy turnData={data} onDblClick={this.handleDoubleClick} onClick={this.handleClick}/>
              </Stage>
            </Box>
            </Grid>
          </Grid>
      </div>
    );
  }
}

//      <Grid item xs={2} >
//             <Drawer
//                      sx={{
//                        '& .MuiDrawer-paper': {
//                        borderLeft: 1,
//                        borderLeftWidth: 5,
//                          width: "40%",
//                          boxSizing: 'border-box',
//                        },
//                      }}
//                      variant="permanent"
//                      anchor="right"
//            >
//               <OrdersProvider>
//                  <OrdersPanel turnData={TURNDATA} sectorData={this.state.sectorData}/>
//               </OrdersProvider>
//            </Drawer>
//      </Grid