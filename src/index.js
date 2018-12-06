import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import { Galaxy} from './SEGalaxy';

const URL = "http://localhost:1337/";

class App extends React.Component {
  constructor(props) {
    super(props);
    console.log("App constructor");
    this.state = {
      data: null,
    };
  }

  componentDidCatch(error, info) {
    // Display fallback UI
    this.setState({
      hasError: true
    });
    console.log("error = " + error);
    console.log("info = " + info);
  }

  componentDidMount() {
    console.log("App Component did mount");
    fetch(URL)
      .then((response) => response.json())
      .then((data) => {
        console.log("Fetched " + URL);
        console.log(data);
        // data = data["data"];

        // console.log(data);
        console.log("Loaded data for " + data["name"] + ", turn " + data["turnNumber"]);
        console.log("Portals = " + Object.keys(data.portals));
        console.log("Sectors = " + Object.keys(data.sectors));
        console.log("Sector 0,0 = " + Object.keys(data.sectors["0_0"]));
        var galaxy = < Galaxy data = { data } />;

        this.setState({
          galaxy: galaxy
        });
      })
  }

  render()
  {
    console.log("app render");

    // if (this.state.hexes == null) {
    if (this.state.galaxy == null) {
      return (<div> </div> ) 
    }

    return ( <div> { this.state.galaxy } </div>)
  }
}

ReactDOM.render(
  <App />,
  document.getElementById('root')
);
