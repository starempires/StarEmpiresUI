import React from 'react';
import { Html } from 'react-konva-utils';

const ContextMenu = ({ position, onOptionSelected, sectorData }) => {
  const handleOptionSelected = option => () => onOptionSelected(option);
  if (position) {
      var header;
      if (sectorData.world) {
          header = sectorData.world.name;
      }
      else if (sectorData.portal) {
          header = sectorData.portal.name;
      }
      else {
          header = "Sector " + sectorData.oblique + "," + sectorData.y;
      }
      const disabled = {opacity:0.6, pointerEvents: 'none'};

      return (<Html>
          <div
           className="menu"
           style={{
             position: "absolute",
             left: position.x,
             top: position.y
           }}
          >
          <ul>
            <li style={{fontWeight: 'bold', pointerEvents: 'none'}}>{header}</li>
            <li style={disabled} onClick={handleOptionSelected("Logistics")}>Logistics</li>
            <li onClick={handleOptionSelected("Combat")}>Combat</li>
            <li onClick={handleOptionSelected("Movement")}>Movement</li>
            <li onClick={handleOptionSelected("Maintenance")}>Maintenance</li>
            <li onClick={handleOptionSelected("Research")}>Research</li>
            <li onClick={handleOptionSelected("Income")}>Income</li>
            <li onClick={handleOptionSelected("Scanning")}>Scanning</li>
          </ul>
         </div>
          </Html>);
  }
  return "";
}

export default ContextMenu;