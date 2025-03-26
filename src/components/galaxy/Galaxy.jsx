import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Layer } from 'react-konva';
import Sector from './Sector.jsx';
import Connections from './Connections.jsx';
import ContextMenu from './ContextMenu.jsx';
import InfoHover from './InfoHover.jsx';
import * as Constants from '../../Constants.jsx';

export default function Galaxy({ turnData, onClick, onDblClick }) {
  const [contextMenuPosition, setContextMenuPosition] = useState(null);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [tooltipX, setTooltipX] = useState(0);
  const [tooltipY, setTooltipY] = useState(0);
  const [tooltipText, setTooltipText] = useState("");
  const [coordText, setCoordText] = useState("");
  const [contextMenuSectorData, setContextMenuSectorData] = useState(null);

  const computeConnections = (turnData) => {
    const connections = [];
    if (turnData.connections) {
      const fromNames = Object.keys(turnData.connections);
      for (let fromName of fromNames) {
        const toNames = turnData.connections[fromName];
        for (let toName of toNames) {
          const fromSector = turnData.sectors[fromName];
          const toSector = turnData.sectors[toName];
          const [fromx, fromy] = Constants.coordsToPosition(turnData.radius, fromSector.oblique, fromSector.y);
          const [tox, toy] = Constants.coordsToPosition(turnData.radius, toSector.oblique, toSector.y);
          connections.push([fromx, fromy, tox, toy]);
        }
      }
    }
    return connections;
  };

  const handleClick = useCallback((e, sectorData) => {
    if (e.evt.button === 0) {
      onClick(e, sectorData);
    }
    e.cancelBubble = true;
  }, [onClick]);

  const handleDoubleClick = useCallback((e) => {
    onDblClick(e);
  }, [onDblClick]);

const handleContextMenu = useCallback((e, sectorData) => {
    e.evt.preventDefault(true);
    const mousePosition = e.target.getStage().getPointerPosition();
    setContextMenuPosition(mousePosition);
    setContextMenuSectorData(sectorData);
  }, []);

  const handleMouseEnter = useCallback((x, y, coordText, text) => {
    setTooltipVisible(true);
    setTooltipX(x);
    setTooltipY(y);
    setCoordText(coordText);
    setTooltipText(text);
  }, []);

  const handleMouseMove = useCallback((x, y) => {
//     console.log("handle mouse move " + x + "," + y + ", tooltipVisible: " + tooltipVisible);
    if (tooltipVisible) {
      setTooltipX(x);
      setTooltipY(y);
    }
  }, [tooltipVisible]);

  const handleMouseLeave = useCallback(() => {
    setTooltipVisible(false);
  }, []);

  const handleOptionSelected = useCallback((option) => {
    console.log("handleOptionSelected", option);
    setContextMenuPosition(null);
  }, []);

  // Create a ref for the dynamic mouse handlers.
  const handlersRef = useRef({
    handleMouseEnter,
    handleMouseLeave,
    handleMouseMove,
    handleClick,
    handleContextMenu,
  });

// Update the ref whenever any of the handlers change.
  useEffect(() => {
    handlersRef.current = {
      handleMouseEnter,
      handleMouseLeave,
      handleMouseMove,
      handleClick,
      handleContextMenu,
    };
  }, [handleMouseEnter, handleMouseLeave, handleMouseMove, handleClick, handleContextMenu]);

  const buildSectors = (turnData) => {
    const sectors = [];
    const radius = turnData.radius;
    for (let y = radius; y >= 0; y--) {
      for (let oblique = y - radius; oblique <= radius; oblique++) {
        const key = Constants.getCoordinateKey(oblique, y);
        const sectorData = turnData.sectors[key];
        if (sectorData && sectorData.status !== Constants.SCAN_STATUS_TYPE.Unknown) {
          sectors.push(
            <Sector
              key={key}
              turnData={turnData}
              oblique={oblique}
              y={y}
            // Instead of passing the handlers directly,
              // pass wrapper functions that read the current handlers from the ref.
              onMouseEnter={(...args) => handlersRef.current.handleMouseEnter(...args)}
              onMouseLeave={(...args) => handlersRef.current.handleMouseLeave(...args)}
              onMouseMove={(...args) => handlersRef.current.handleMouseMove(...args)}
              onClick={(...args) => handlersRef.current.handleClick(...args)}
              onContextMenu={(...args) => handlersRef.current.handleContextMenu(...args)}

            />
          );
        }
      }
    }
    for (let y = -1; y >= -radius; y--) {
      for (let oblique = -radius; oblique <= radius + y; oblique++) {
        const key = Constants.getCoordinateKey(oblique, y);
        const sectorData = turnData.sectors[key];
        if (sectorData && sectorData.status !== Constants.SCAN_STATUS_TYPE.Unknown) {
          sectors.push(
            <Sector
              key={key}
              turnData={turnData}
              oblique={oblique}
              y={y}
                     // Instead of passing the handlers directly,
                       // pass wrapper functions that read the current handlers from the ref.
                       onMouseEnter={(...args) => handlersRef.current.handleMouseEnter(...args)}
                       onMouseLeave={(...args) => handlersRef.current.handleMouseLeave(...args)}
                       onMouseMove={(...args) => handlersRef.current.handleMouseMove(...args)}
                       onClick={(...args) => handlersRef.current.handleClick(...args)}
                       onContextMenu={(...args) => handlersRef.current.handleContextMenu(...args)}

            />
          );
        }
      }
    }
    return sectors;
  };

  const sectors = useMemo(() => buildSectors(turnData), [turnData]);
  const connections = useMemo(() => computeConnections(turnData), [turnData]);


  return (
    <Layer offset={{ y: -30 }} onDblClick={handleDoubleClick}>
      {sectors}
      <Connections connections={connections} />
      <InfoHover
        visible={tooltipVisible}
        x={tooltipX}
        y={tooltipY}
        text={tooltipText}
      />
      <ContextMenu
        position={contextMenuPosition}
        onOptionSelected={handleOptionSelected}
        sectorData={contextMenuSectorData}
      />
    </Layer>
  );
}