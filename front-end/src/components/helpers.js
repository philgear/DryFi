
export default function getDryTime (tempF, humidity, windspeed) {
    
    const tempC = (tempF-32)*5/9;
    const tempK = tempC+273.15;
   const  x = 21.07 - (5336 / tempK);
  const   delta = Math.exp(x)*5336/(tempK*tempK);
   const lambda = 2.501 - (0.002361 * (tempK - 273));
   const gamma = 0.0016286 * 101.3 / lambda;
   const d = (1 - humidity) * Math.exp(x);
  const  rn = 340 * 30 * 60 / 1000000
const  e = ((delta*rn)+(gamma*6.43*d*(1+(0.536*windspeed))))/(lambda*(delta+gamma));
   const rho = 1000;
   const mass = 0.075;
  const  surfaceArea = 0.75;
 const  t = mass/(rho*e*surfaceArea*60);
const hours=Math.floor(t/60)
const minutes=Math.floor(t%60)
const time=[hours, minutes]
return time
    // return t;
  }

