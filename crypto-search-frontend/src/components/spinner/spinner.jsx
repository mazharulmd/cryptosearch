import React from "react";

export class Spinner extends React.Component {

  /*
   * style definitions of 'container-d422aee5' and
   * 'spinner-bf6c4662' are defined in 'spinner.css' in public folder
   */
  render() {
    const { id, } = this.props;

    return <div id={id} className="container-d422aee5">
      <div className="container-ef6df753">
        <div className="spinner-bf6c4662" />
      </div>
    </div>;
  }
}
