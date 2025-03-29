import {useState, useMemo} from 'react';
import { Group, Rect, Text } from 'react-konva';

const OPTIONS = ['Logistics', 'Combat', 'Movement', 'Maintenance', 'Research', 'Income', 'Scanning'];
const ITEM_HEIGHT = 30;
const OPTIONS_WIDTH = Math.max(...OPTIONS.map(option => option.length * 10 + 20));

const ContextMenu = ({ position, onOptionSelected, sectorData } :
         { position: { x: number; y: number } | null;
           onOptionSelected: (option: string, sectorData: any) => void;
           sectorData: any}
    ) => {

    if (!position || !sectorData) {
        return null;
    }

    const [hoveredOptionIndex, setHoveredOptionIndex] = useState<number | null>(null);
    const [visible, setVisible] = useState(true);

    const header = useMemo(() => {
        let rv = null;
        if (sectorData.world) {
            rv = sectorData.world.name;
        }
        else if (sectorData.portals) {
            rv = sectorData.portals[0].name;
        }
        else if (sectorData.storms) {
            rv = sectorData.storms[0].name;
        }
        rv = (rv == null ? "" : rv + " ");
        return rv + "(" + sectorData.oblique + "," + sectorData.y + ")";
    }, [sectorData]);

    if (!visible) {
        return null;
    }

    const headerWidth = header.length * 10 + 20;
    const menuWidth = Math.max(headerWidth, OPTIONS_WIDTH);

  return (
     <Group x={position.x} y={position.y}>
        <Group key="header">
          <Rect
            x={0}
            y={0}
            width={menuWidth}
            height={ITEM_HEIGHT}
            fill="lightblue" // You can change the header background color as desired
            stroke="black"
          />
          <Text
            text={header}
            x={10}
            y={5}
            fontSize={16}
            fill="black"
          />
        </Group>

      {OPTIONS.map((option, index) => {
        // Calculate the y position: if header exists, shift options down by one ITEM_HEIGHT.
        const yPos = (index + 1) * ITEM_HEIGHT;
        return (
          <Group
            listening={false}
            key={option}
            onClick={ (e) => {
                 e.cancelBubble = true;
                 onOptionSelected(option, sectorData);
                 setVisible(false);
            }}
            onMouseEnter={() => setHoveredOptionIndex(index)}
            onMouseLeave={() => setHoveredOptionIndex(null)}
          >
            <Rect
              x={0}
              y={yPos}
              width={menuWidth}
              height={ITEM_HEIGHT}
              fill={hoveredOptionIndex === index ? 'lightgray' : 'white'}
              stroke="black"
            />
            <Text
              text={option}
              x={10}
              y={yPos + 5}
              fontSize={14}
              fill="black"
            />
          </Group>
        );
      })}
    </Group>
  );
}

export default ContextMenu;