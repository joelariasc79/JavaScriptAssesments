//1. Send Data (userName and userAddress) from child component to SudentComponent
//2. Once data passed from child component to StudentComponent, it should be displayed in Student state object and virtual dom, 
//   then be passed again as props in Child Component
//- Demostrate the usage of PureComponent and see if you have should component implemented in it then what happens
//3. access view constructor, component will unmount life cycle methods, see if you can or not
//4. add a condition in should component update, to not call the render method, if data is not updated
//5. pass the previous state and prev props objects from getSnaphotbefore update life cycle method and use the same in 
// Component Did update and use setState to change the value to previous state