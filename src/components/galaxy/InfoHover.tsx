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
                  pointerWidth={20}
                 listening={false}
                  fill={Constants.INFO_HOVER_BACKGROUND_COLOR}
             />
             <Text text={text}
                   width={200}
                   height={100}
                 listening={false}
                   fontSize={Constants.INFO_HOVER_FONT_SIZE}
                   fontFamily={Constants.INFO_HOVER_FONT_FAMILY}
                   fill={Constants.INFO_HOVER_TEXT_COLOR} />
          </Label>
      );
}