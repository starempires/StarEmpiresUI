import { Text, Label, Tag } from 'react-konva';
import * as Constants from '../../Constants';

export default function InfoHover({x, y, text, visible}: {x: number; y: number; text: string; visible: boolean}) {

    return (
          <Label visible={visible}
                 listening={false}
                 x={x + Constants.INFO_HOVER_X_OFFSET }
                 y={y + Constants.INFO_HOVER_Y_OFFSET }
           >
             <Tag pointerDirection="left"
                  pointerHeight={10}
                  pointerWidth={Constants.RADIUS/2}
                  listening={false}
                  fill={Constants.INFO_HOVER_BACKGROUND_COLOR}
                  stroke={Constants.INFO_HOVER_BORDER_COLOR}
                  strokeWidth={1}
             />
             <Text text={text}
                   width={250}
                   height={100}
                   padding={Constants.INFO_HOVER_PADDING}
                   listening={false}
                   fontSize={Constants.INFO_HOVER_FONT_SIZE}
                   fontFamily={Constants.INFO_HOVER_FONT_FAMILY}
                   fill={Constants.INFO_HOVER_TEXT_COLOR} />
          </Label>
      );
}