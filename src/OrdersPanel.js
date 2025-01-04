import React, { useState } from 'react';
import Drawer from '@mui/material/Drawer';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Container from '@mui/material/Container';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Typography from '@mui/material/Typography';
import PropTypes from 'prop-types';
import LogisticsPanel from './LogisticsPanel';
import CombatPanel from './CombatPanel';
import {buildSectorText} from './SectorTextBuilder';

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
          <Typography component="span">{children}</Typography>
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

export default function OrdersPanel(props) {

  const [tabIndex, setTabIndex] = useState(0);

  const tabStyle = {fontSize:10, padding: 1, minWidth:"5%", fontFamily:'bold'};

  const handleOnTabChange = (event, value) => {
      console.log("Clicked tab value " + value);
      setTabIndex(value)
  };

   return (
       <Box sx={{ width: '100%' }}>
         <Stack sx={{alignItems: 'center'}} spacing={2}>
           <Box sx={{ borderBottom: 2, borderColor: 'divider' }}>
               <Typography style={{whiteSpace: 'pre-line', alignItems: 'left'}}>{ buildSectorText(props.turnData, props.sectorData) }</Typography>
           </Box>
           <Box sx={{ borderBottom: 2, borderColor: 'divider' }}>
                <Tabs sx={{padding:0}} value={tabIndex} onChange={handleOnTabChange}>
                  <Tab sx={tabStyle} label="Logistics" />
                  <Tab sx={tabStyle} label="Combat" />
                  <Tab sx={tabStyle} label="Movement" />
                  <Tab sx={tabStyle} label="Maintenance" />
                  <Tab sx={tabStyle} label="Research" />
                  <Tab sx={tabStyle} label="Income" />
                  <Tab sx={tabStyle} label="Scanning" />
                </Tabs>
           </Box>
            <TabPanel value={tabIndex} index={0}>
              <LogisticsPanel turnData={props.turnData} sectorData={props.sectorData}/>
            </TabPanel>
            <TabPanel value={tabIndex} index={1}>
              <CombatPanel turnData={props.turnData} sectorData={props.sectorData}/>
            </TabPanel>
            <TabPanel value={tabIndex} index={2}>
               Movement
            </TabPanel>
            <TabPanel value={tabIndex} index={3}>
               Maintenance
            </TabPanel>
            <TabPanel value={tabIndex} index={4}>
               Research
            </TabPanel>
            <TabPanel value={tabIndex} index={5}>
               Income
            </TabPanel>
            <TabPanel value={tabIndex} index={6}>
               Scanning
            </TabPanel>
         </Stack>
       </Box>
   );
}
//            <TabPanel value={this.state.tabIndex} index={0}>
//               Logistics
//               <LogisticsPanel sectorData={this.state.sectorData}/>
//            </TabPanel>
//            <TabPanel value={this.state.tabIndex} index={1}>
//               Combat
//            </TabPanel>
//            <TabPanel value={this.state.tabIndex} index={2}>
//               Movement
//            </TabPanel>
//            <TabPanel value={this.state.tabIndex} index={3}>
//               Maintenance
//            </TabPanel>
//            <TabPanel value={this.state.tabIndex} index={4}>
//               Research
//            </TabPanel>
//            <TabPanel value={this.state.tabIndex} index={5}>
//               Income
//            </TabPanel>
//            <TabPanel value={this.state.tabIndex} index={6}>
//               Scanning
//            </TabPanel>
