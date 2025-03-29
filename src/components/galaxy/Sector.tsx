import { useMemo } from 'react';
import { Group } from 'react-konva';
import Coords from './Coords';
import World from './World';
import Portal from './Portal';
import Border from './Border';
import Hex from './Hex';
import ShipDots from './ShipDots';
import * as Constants from '../../Constants';
import { BorderType } from '../../Constants';
import {buildSectorText} from '../common/SectorTextBuilder';

interface SectorProps {
  turnData: any;
  oblique: number;
  y: number;
  onClick: (e: any, sector: any) => void;
  onContextMenu: (e: any, sector: any) => void;
  onMouseEnter: (x: number, y: number, text: string) => void;
  onMouseLeave: () => void;
  onMouseMove: (x: number, y: number) => void;
}

export default function Sector(props: SectorProps) {
      const {
        turnData,
        oblique,
        y,
        onMouseEnter,
        onMouseMove,
        onMouseLeave,
        onClick,
        onContextMenu
      } = props;

    const {
      scanColor,
      coordsText,
      borderType,
      coordsColor,
      world,
      portals,
      shipDotColors,
      xpos,
      ypos,
      sectorData,
      hoverText,
      unidentifiedShips,
      worldColor,
      prohibition,
      collapsed
    } = useMemo(() => {
      const [xpos, ypos] = Constants.coordsToPosition(turnData.radius, oblique, y);
      const sectorKey = Constants.getCoordinateKey(oblique, y);
      let sectorData = turnData.sectors[sectorKey];
      if (!sectorData) {
          sectorData = { status: 'unknown', oblique, y };
      }
      const scanColor = Constants.SECTOR_STATUS_COLOR_MAP.get(sectorData.status) || "black";
      const coordsText = `${sectorData.oblique ?? '?'},${sectorData.y ?? '?'}`;
      const coordsColor = Constants.COORDS_STATUS_COLOR_MAP.get(sectorData.status) || "white";

      let borderType: BorderType = Constants.BORDER_TYPE.Regular;
      if (sectorData.storms) {
          borderType = Constants.BORDER_TYPE.Nebula;
          if (sectorData.storms.find((storm: any) => storm.rating > 0)) {
              borderType = Constants.BORDER_TYPE.Storm;
          }
      }

    let worldColor;
    let prohibition;
    const world = sectorData.world;
    if (world) {
      if (world.owner) {
        worldColor = turnData.colors[world.owner];
        prohibition = world.prohibition;
      } else {
        worldColor = turnData.colors['unowned'];
      }
    }

     const portals = sectorData.portals;

     let shipDotColors: string[] = [];
     if (sectorData.ships) {
         let empiresPresent = Object.keys(sectorData.ships);
         shipDotColors = empiresPresent.map((e) => turnData.colors[e]);
     }

     const hoverText = buildSectorText(turnData, sectorData);
     const unidentifiedShips = sectorData.unidentifiedShipCount || 0;
     const collapsed = portals && (portals.length > 1 || portals[0]?.collapsed);

    return {
      scanColor,
      coordsText,
      borderType,
      coordsColor,
      world,
      portals,
      shipDotColors,
      xpos,
      ypos,
      sectorData,
      hoverText,
      unidentifiedShips,
      worldColor,
      prohibition,
      collapsed
    };
  }, [turnData, oblique, y]);

    return (
      <Group
        onClick={(e: any) => onClick(e, sectorData)}
        onContextMenu={(e: any) => onContextMenu(e, sectorData)}
        onMouseEnter={(e: any) => {
          const mousePosition = e.target.getStage().getPointerPosition();
          onMouseEnter(mousePosition.x, mousePosition.y, hoverText);
        }}
        onMouseMove={(e: any) => {
          const mousePosition = e.target.getStage().getPointerPosition();
          onMouseMove(mousePosition.x, mousePosition.y);
        }}
        onMouseLeave={onMouseLeave}
      >
        <Hex color={scanColor} x={xpos} y={ypos} />
        <Coords x={xpos} y={ypos} text={coordsText} color={coordsColor} />
        {world && (
          <World
            x={xpos}
            y={ypos}
            color={worldColor}
            production={world.production}
            prohibition={prohibition}
            border={world.homeworld}
          />
        )}
        {portals && <Portal x={xpos} y={ypos} collapsed={collapsed} />}
        <ShipDots
          x={xpos}
          y={ypos}
          unidentifiedShips={unidentifiedShips}
          shipDotColors={shipDotColors}
        />
        <Border x={xpos} y={ypos} type={borderType} />
      </Group>
    );
}