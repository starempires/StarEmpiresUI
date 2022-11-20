import React from 'react';
import {
    Group,
    Text,
    Rect
} from 'react-konva';
export class SEInfoPopup extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            galaxy: props.galaxy,
            sector: props.sector,
            x: props.x,
            y: props.y,
            visible: props.visible,
            text: props.text // this.getSectorText(props.sector, props.galaxy)
        };
        console.log("SEInfoPopup constructor vis = " + props.visible);
        console.log("SEInfoPopup constructor text = " + props.text);
    }
   
    //  getSectorText(sector, galaxy) {
    // var sectorText = "";
    // if (sector) {
    //   var hexOb = sector.oblique;
    //   var hexY = sector.y;
    //   sectorText = hexOb + "," + hexY;
    //   var worldName = sector.world;
    //   if (worldName) {
    //     var world = galaxy.worlds[worldName];
    //     var production = world.production;
    //     sectorText += " " + worldName + "(" + production + ")";
    //   }
    // }
//     return sectorText;
//   }

//   setVisible(state) {
//       this.setState({visible: state});
//   }

   
      render()
  {
        console.log("SEInfo render visible = " + this.state.visible);
    return(
        <Group>

        <Rect fill={'#ddd'} 
              stroke={'#555'}
              height={50} 
              width={200}
              x={this.state.x} 
              y={this.state.y} 
              visible={this.state.visible}
        />
         <Text fill={'black'}
                 padding={10} fontSize={12}
                fontFamily={'Calibri'}
                 align={'left'}
                 width={200}
                 height={50}
                x={this.state.x} y={this.state.y} 
                visible={this.state.visible}
                text={this.state.text}/>
          </Group>  
    )
  }
}
