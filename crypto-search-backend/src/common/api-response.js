class ApiResponse {

  constructor() {
    this.currentDate = new Date().toUTCString();
    this.status = 0;
    this.message = "";
    this.data = {};
  }
}

module.exports = ApiResponse;
