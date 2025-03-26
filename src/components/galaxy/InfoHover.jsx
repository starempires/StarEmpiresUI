import { Text, Label, Tag } from 'react-konva';
import * as Constants from '../../Constants.jsx';

export default function InfoHover(props) {

    return (
          <Label visible={props.visible}
                 x={props.x + Constants.INFO_HOVER_X_OFFSET }
                 y={props.y + Constants.INFO_HOVER_Y_OFFSET }
                 >
             <Tag
             pointerDirection="left"
             pointerHeight={10}
             pointerWidth={20}
             fill={Constants.INFO_HOVER_BACKGROUND_COLOR}
                 />
             <Text text={props.text}
              width={200}
              height={100}
                   fontSize={Constants.INFO_HOVER_FONT_SIZE}
                   fontFamily={Constants.INFO_HOVER_FONT_FAMILY}
                   fill={Constants.INFO_HOVER_TEXT_COLOR} />
          </Label>
      );
}