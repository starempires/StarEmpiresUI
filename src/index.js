
import "./index.css";
import React, { Component } from 'react';
import Konva from 'konva';
import ReactDOM from 'react-dom';
import { createRoot } from 'react-dom/client';
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
import OrdersPanel from './OrdersPanel';
import {OrdersProvider} from './OrdersContext';

const TURNDATA = require("./snapshot.json");

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
       this.setState({sectorData: sectorData});
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
               <OrdersProvider>
                  <OrdersPanel turnData={TURNDATA} sectorData={this.state.sectorData}/>
               </OrdersProvider>
            </Drawer>
      </Grid>
      </Grid>

      </div>
    );
  }
}

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);

//ReactDOM.render(
//  <React.StrictMode>
//    <App />
//  </React.StrictMode>,
//  document.getElementById('root')
//);
