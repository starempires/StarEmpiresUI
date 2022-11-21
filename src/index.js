
import "./index.css";
import React, { Component } from 'react';
import Konva from 'konva';
import ReactDOM from 'react-dom';
//import { createRoot } from 'react-dom/client';
import { Stage } from 'react-konva';
import Galaxy from './Galaxy';
import * as Constants from './Constants';
import Drawer from '@mui/material/Drawer';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Typography from '@mui/material/Typography';
import PropTypes from 'prop-types';
import LogisticsPanel from './LogisticsPanel';

const TURNDATA = require("./TheCulture_turn0.json");

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          <Typography>{children}</Typography>
        </Box>
      )}
    </div>
  );
}

TabPanel.propTypes = {
  children: PropTypes.node,
  index: PropTypes.number.isRequired,
  value: PropTypes.number.isRequired,
};

class App extends Component {

  constructor(props) {
     super(props);
//     console.log("r = " + TURNDATA.radius);
     this.handleDoubleClick = this.handleDoubleClick.bind(this);
     this.handleClick = this.handleClick.bind(this);
     this.handleOnTabChange = this.handleOnTabChange.bind(this);
     this.state = {isOpen:false, tabIndex:0, sectorData: null};
  }

  handleDoubleClick(event)
  {
     event.evt.preventDefault(true);
     this.setState({isOpen: !this.state.isOpen})
  }

   handleClick(event, sectorData)
   {
       event.evt.preventDefault(true);
       console.log("left click (button " + event.evt.button + ") = " + sectorData.oblique + "," + sectorData.y);
    }

  handleOnTabChange(event, value)
  {
//    console.log("clicked tab v=" + value);
    this.setState({tabIndex: value});
  }

  render() {
   const size = TURNDATA.radius * 10 * Constants.RADIUS;
//   console.log("size = " + size);

    const tabStyle = {fontSize:10, padding: 1, minWidth:"5%", fontFamily:'bold'};

    return (
      <div>
        <Grid container spacing={2}>
              <Grid item xs={10}>
      <Stage width={size} height={size} >

          <Galaxy turnData={TURNDATA} onDblClick={this.handleDoubleClick} onClick={this.handleClick}/>
      </Stage>
      </Grid>
      <Grid item xs={2} >
             <Drawer
                      sx={{
                        '& .MuiDrawer-paper': {
                        borderLeft: 1,
                        borderLeftWidth: 5,
                          width: "40%",
                          boxSizing: 'border-box',
                        },
                      }}
                      variant="permanent"
                      anchor="right"
            >

                  <Box sx={{ width: '100%' }}>
                       <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                         <Tabs sx={{padding:0}} value={this.state.tabIndex} onChange={this.handleOnTabChange}>
                           <Tab sx={tabStyle} label="Logistics" />
                           <Tab sx={tabStyle} label="Combat" />
                           <Tab sx={tabStyle} label="Movement" />
                           <Tab sx={tabStyle} label="Maintenance" />
                           <Tab sx={tabStyle} label="Research" />
                           <Tab sx={tabStyle} label="Income" />
                           <Tab sx={tabStyle} label="Scanning" />
                         </Tabs>
                       </Box>
                       <TabPanel value={this.state.tabIndex} index={0}>
                           Logistics
                           <LogisticsPanel sectorData={this.state.sectorData}/>
                       </TabPanel>
                       <TabPanel value={this.state.tabIndex} index={1}>
                               Combat
                       </TabPanel>
                       <TabPanel value={this.state.tabIndex} index={2}>
                               Movement
                       </TabPanel>
                       <TabPanel value={this.state.tabIndex} index={3}>
                               Maintenance
                       </TabPanel>
                       <TabPanel value={this.state.tabIndex} index={4}>
                               Research
                       </TabPanel>
                       <TabPanel value={this.state.tabIndex} index={5}>
                               Income
                       </TabPanel>
                       <TabPanel value={this.state.tabIndex} index={6}>
                               Scanning
                       </TabPanel>
                     </Box>
            </Drawer>
      </Grid>
      </Grid>

      </div>
    );
  }
}

//const container = document.getElementById('root');
//const root = createRoot(container);
//root.render(<App />);

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);
