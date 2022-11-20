/*

POC effort to demonstrate drawing hexes, hover menus and popup menus.

*/

import "./index.css";
import React, { Component } from 'react';
import Konva from 'konva';
import ReactDOM from 'react-dom';
//import { createRoot } from 'react-dom/client';
import { Stage, Layer, Group, Shape, Circle, Line, RegularPolygon, Text, Label, Tag } from 'react-konva';
import { Html, Portal} from 'react-konva-utils';

const SQRT_THREE = Math.sqrt(3);
const RADIUS = 30;
const SHORT_SIDE = RADIUS / 2;
const LONG_SIDE = SQRT_THREE * RADIUS /2;

const ContextMenu = ({ position, onOptionSelected }) => {
  const handleOptionSelected = option => () => onOptionSelected(option);

//  console.log("ContxetMenu position " + JSON.stringify(position));
  const div = position ? (
     <div
      className="menu"
      style={{
        position: "absolute",
        left: position.x,
        top: position.y
      }}
    >
      <ul>
        <li onClick={handleOptionSelected("option1")}>Option1</li>
        <li onClick={handleOptionSelected("option2")}>Option2</li>
      </ul>
    </div>
  ) : "";
  return div;
};

class Hex extends Component {
  constructor(props) {
    super(props);
//    console.log("Hex props = " + JSON.stringify(props));
  }


  render() {
    //console.log("render hex, onClick = " + this.props.onClick);
    return (
        <RegularPolygon
            x={this.props.x}
            y={this.props.y}
            sides={6}
            radius={35}
            rotation={30}
            fill={this.props.color}
            strokeWidth={1}
        />
    );
  }
}

class Border extends Component {
  constructor(props) {
    super(props);
  }
    handleMouseEnter = e => {
//      console.log("Called Hex.handleMouseEnter " + JSON.stringify(e));
      const mousePosition = e.target.getStage().getPointerPosition();
      this.props.onMouseEnter(mousePosition.x, mousePosition.y, this.props.name);
    };

    handleMouseMove = e => {
//      console.log("Called Hex.handleMouseMove");
      const mousePosition = e.target.getStage().getPointerPosition();
       this.props.onMouseMove(mousePosition.x, mousePosition.y);
    };

    handleMouseLeave = e => {
//      console.log("Called Hex.handleMouseLeave " + JSON.stringify(e));
      this.props.onMouseLeave();
    };

  render() {
    return (
          <RegularPolygon
              x={this.props.x}
              y={this.props.y}
              sides={6}
              radius={35}
              rotation={30}
              stroke={this.props.color}
              strokeWidth={1}
            onClick={this.props.onClick}
            onMouseEnter={this.handleMouseEnter}
            onMouseLeave={this.handleMouseLeave}
            onMouseMove={this.handleMouseMove}
          />
    );
  }
}

class World extends Component {
  constructor(props) {
    super(props);
  }
  render() {
    return (
        <Circle
            x={this.props.x}
            y={this.props.y}
            radius={15}
            stroke="black"
            strokeWidth={1}
            //fillLinearGradientStartPoint={{ x: 0, y: 0 }}
            //fillLinearGradientEndPoint={{ x: 10, y: 15 }}
            //fillLinearGradientColorStops={[0, 'lightblue', 0.8, 'blue', 1, 'green']}
            fillRadialGradientStartRadius={2}
            fillRadialGradientEndRadius={15}
            fillRadialGradientStartPoint={{ x: 5, y: 5 }}
            //fillRadialGradientEndPoint={{ x: -5, y: 5 }}
            fillRadialGradientColorStops={[0, 'lightblue', 1, 'darkblue']}
            onClick={this.props.onClick}
          />
    );
  }
}

class MapPortal extends Component {
  constructor(props) {
    super(props);
  }

  sf(context, shape) {
    var shortSide = SHORT_SIDE;
    var longSide = LONG_SIDE;
    var radius = RADIUS;
    var distance = RADIUS /2;
    context.strokeStyle = '#0000FF';
    context.lineWidth=2;

    context.beginPath();
    context.moveTo(-distance, 0);
    context.lineTo(distance,0);
    context.stroke();

    context.beginPath();
    context.moveTo(0, -distance);
    context.lineTo(0, distance);
    context.stroke();

    context.beginPath();
    context.moveTo(-distance/2, -distance/2);
    context.lineTo(distance/2, distance/2);
    context.stroke();

    context.beginPath();
    context.moveTo(distance/2, -distance/2);
    context.lineTo(-distance/2, distance/2);
    context.stroke();
  }

  render() {
    return (
        <Shape
            x={this.props.x}
            y={this.props.y}
            sceneFunc={this.sf}
            onClick={this.props.onClick}
          />
    );
  }
}

class Coords extends Component {

  constructor(props) {
    super(props);
  }

  sf(context, shape) {
       var text = shape.attrs.text; // access properties set on <Shape> with attrs here
       context.rotate(0);
       context.font = '10px Calibri';
       context.textAlign = 'center';
       context.fillStyle = 'black';
       context.fillText(text, 0, 24);
       context.rotate(0);
  }

  render() {
    return (
        <Shape
            x={this.props.x}
            y={this.props.y}
            text={this.props.text}
            sceneFunc={this.sf}
            stroke="black"
            onClick={this.props.onClick}
          />
    );
  }
}

class Obstruction extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    var fromx = this.props.x-SHORT_SIDE;
    var fromy = this.props.y-LONG_SIDE;
    var tox = this.props.x+SHORT_SIDE;
    var toy = this.props.y+LONG_SIDE;

    var fromx2 = this.props.x-SHORT_SIDE;
    var fromy2 = this.props.y+LONG_SIDE;
    var tox2 = this.props.x+SHORT_SIDE;
    var toy2 = this.props.y-LONG_SIDE;
    return (<Group>
             <Line
                points={[fromx, fromy, tox, toy]}
                stroke="red"
            onClick={this.props.onClick}
              />
             {this.props.interdicted &&  
                <Line
                  points={[fromx2, fromy2, tox2, toy2]}
                  stroke="red"
            onClick={this.props.onClick}
                />}
           </Group>);
   }
}


class App extends Component {

  constructor(props) {
     super(props);
     this.state = { selectedContextMenu: null, tooltipVisible: false, tooltipX: 0, tooltipY: 0, tooltipText: "" };
     //this.handleClick = this.handleClick.bind(this);
     this.handleMouseEnter = this.handleMouseEnter.bind(this);
     this.handleMouseLeave = this.handleMouseLeave.bind(this);
     this.handleMouseMove = this.handleMouseMove.bind(this);
  }

  handleOptionSelected = option => {
    console.log("handleOptionSelected " + option);
    this.setState({ selectedContextMenu: null });
  };

  handleContextMenu = (e) => {
    e.evt.preventDefault(true); // NB!!!! Remember the ***TRUE***
    const mousePosition = e.target.getStage().getPointerPosition();
    const x = mousePosition.x | 0;
    const y = mousePosition.y | 0;
    console.log("right click (button " + e.evt.button + ") = " + JSON.stringify(mousePosition) + ", x=" + x + ", y=" + y);
     this.setState({
          selectedContextMenu: {
            //type: "START",
            position: mousePosition
          }
        });
  };

  handleClick = (e) => {
    if (e.evt.button == 0) {
        console.log("left click (button " + e.evt.button + ") = " + JSON.stringify(e.evt));
        this.setState({ selectedContextMenu: null });
    }
    else {
        //console.log("handleClick ignored");
    }
    e.cancelBubble = true;
  };

  handleDoubleClick = e => {
    console.log("handleDoubleClick target = " + JSON.stringify(e) );
    e.cancelBubble = true;
  };

//  handleMouseEnter = e => {
 //   console.log("handleMouseEnter = " + JSON.stringify(e) );
  //  const mousePosition = e.target.getStage().getPointerPosition();
  handleMouseEnter(x, y, text) {
//    console.log("Called App.handleMouseEnter state = " + JSON.stringify(this.state));
    this.setState({tooltipVisible: true, tooltipX: x, tooltipY:y, tooltipText: text } );
  }

   handleMouseMove(x, y) {
       if (this.state.tooltipVisible) {
           this.setState({tooltipX: x, tooltipY:y } );
       }
  }

  //handleMouseLeave = e => {
   // console.log("handleMouseLeave = " + JSON.stringify(e) );
   handleMouseLeave() {
    this.setState({tooltipVisible: false } );
  }

  render() {
//    console.log("App.render state = " + JSON.stringify(this.state));
    const show = true;
    const { selectedContextMenu } = this.state;
    return (
      <Stage width={window.innerWidth} height={window.innerHeight} onClick={this.handleClick}
             onDblClick={this.handleDoubleClick}
             onContextMenu={this.handleContextMenu}>
        <Layer>
          <Hex color="lightgrey" x={90} y={90}  />
          {show && <World x={90} y={85} /> }
          {show && <Coords x={90} y={90} text={"3,1"} />}
          {show && <Obstruction x={90} y={90} interdicted={true} />}
          <Border name="3,1" x={90} y={90} color="red" onMouseEnter={this.handleMouseEnter} onMouseLeave={this.handleMouseLeave} onMouseMove={this.handleMouseMove} />

          <Hex color="#777777" x={200} y={200} onMouseEnter={this.handleMouseEnter} onMouseLeave={this.handleMouseLeave} onMouseMove={this.handleMouseMove} />
          <Coords x={200} y={200} text={"10,10"}/>
          <MapPortal x={200} y={195} />
          <Border name="10,10" x={200} y={200} color="black" onMouseEnter={this.handleMouseEnter} onMouseLeave={this.handleMouseLeave} onMouseMove={this.handleMouseMove} />

          <Hex color="white" x={200} y={90} onMouseEnter={this.handleMouseEnter} onMouseLeave={this.handleMouseLeave} onMouseMove={this.handleMouseMove} />
          <Coords x={200} y={90} text={"-3,-3"}/>
          <Border name="-3,-3" x={200} y={90} color="blue" onMouseEnter={this.handleMouseEnter} onMouseLeave={this.handleMouseLeave} onMouseMove={this.handleMouseMove} />


          <Label visible={this.state.tooltipVisible} x={this.state.tooltipX + 20 } y={this.state.tooltipY + 20 }>
             <Tag  fill="lightgrey" />
             <Text  text={this.state.tooltipText} fontSize={20} fontFamily="Calibri" fill="black" padding={5}  />
          </Label>

<Html>
  <ContextMenu
                {...selectedContextMenu}
                onOptionSelected={this.handleOptionSelected}
              />
</Html>
        </Layer>
      </Stage>
    );
  }
}

//const container = document.getElementById('root');
//const root = createRoot(container);
//root.render(<App />);

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);

