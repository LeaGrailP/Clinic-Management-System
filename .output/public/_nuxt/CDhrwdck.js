import{z as e,A as o}from"#entry";const r=e(()=>{if(localStorage.getItem("role")!=="admin")return o("/unauthorized")});export{r as default};
