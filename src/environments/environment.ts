import packageInfo from '../../package.json';

export const environment = {
  appVersion: packageInfo.version,
  production: false,
  // apiUrl: 'https://botrestaurantapi.brosonetech.com'
    s3Url: "https://kovilpatti.s3.ap-south-1.amazonaws.com/",
  apiUrl: "http://localhost:5153",
  //  apiUrl: "http://sessapi.brositecom.com",
 
};


