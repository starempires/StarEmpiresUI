import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Layer } from 'react-konva';
import Sector from './Sector';
import Connections from './Connections';
import ContextMenu from './ContextMenu';
import InfoHover from './InfoHover';
import * as Constants from '../../Constants';

export default function Galaxy({turnData, onClick, onDblClick }: {turnData: any;
                                                                   onClick: (e: any, sectorData: any) => void;
                                                                   onDblClick: (e: any) => void;}) {
  const [contextMenuPosition, setContextMenuPosition] = useState<{ x: number; y: number } | null>(null);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [tooltipX, setTooltipX] = useState(0);
  const [tooltipY, setTooltipY] = useState(0);
  const [tooltipText, setTooltipText] = useState("");
  const [contextMenuSectorData, setContextMenuSectorData] = useState(null);

  const computeConnections = (turnData: any) => {
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

  const handleClick = useCallback((e: any, sectorData: any) => {
    if (e.evt.button === 0) {
      onClick(e, sectorData);
    }
    e.cancelBubble = true;
  }, [onClick]);

  const handleDoubleClick = useCallback((e: any) => {
    onDblClick(e);
  }, [onDblClick]);

const handleContextMenu = useCallback((e: any, sectorData: any) => {
    e.evt.preventDefault(true);
    const mousePosition = e.target.getStage().getPointerPosition();
    setContextMenuPosition(mousePosition);
    setContextMenuSectorData(sectorData);
  }, []);

  const handleMouseEnter = useCallback((x: number, y: number, text: string) => {
    setTooltipVisible(true);
    setTooltipX(x);
    setTooltipY(y);
    setTooltipText(text);
  }, []);

  const handleMouseMove = useCallback((x: number, y: number) => {
//     console.log("handle mouse move " + x + "," + y + ", tooltipVisible: " + tooltipVisible);
    if (tooltipVisible) {
      setTooltipX(x);
      setTooltipY(y);
    }
  }, [tooltipVisible]);

  const handleMouseLeave = useCallback(() => {
    setTooltipVisible(false);
  }, []);

  const handleOptionSelected = useCallback((option: any, sectorData: any) => {
    console.log("handleOptionSelected " + option + ", sector was " + sectorData.oblique + "," + sectorData.y);
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

  const buildSectors = (turnData: any) => {
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
              onMouseEnter={(...args: [number, number, string]) => handlersRef.current.handleMouseEnter(...args)}
              onMouseLeave={() => handlersRef.current.handleMouseLeave()}
              onMouseMove={(...args: [number, number]) => handlersRef.current.handleMouseMove(...args)}
              onClick={(...args: [any, any]) => handlersRef.current.handleClick(...args)}
              onContextMenu={(...args: [any, any]) => handlersRef.current.handleContextMenu(...args)}
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
                       onMouseEnter={(...args: [number, number, string]) => handlersRef.current.handleMouseEnter(...args)}
                       onMouseLeave={() => handlersRef.current.handleMouseLeave()}
                       onMouseMove={(...args: [number, number]) => handlersRef.current.handleMouseMove(...args)}
                       onClick={(...args: [any, any]) => handlersRef.current.handleClick(...args)}
                       onContextMenu={(...args: [any, any]) => handlersRef.current.handleContextMenu(...args)}
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
    <Layer offset={{ x: 0, y: -30 }} onDblClick={handleDoubleClick}>
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