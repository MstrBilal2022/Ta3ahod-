// chow menu of links and hidden it 
export function header (){
  let overlay = document.querySelector(".overlay")
    let menu = document.getElementById("menu");
    let icon = document.getElementById("icon");
    let span = document.querySelector("nav .icon span:nth-child(2)")
    // console.log(menu)
    icon.addEventListener("click", () => {
      menu.classList.toggle("active");
      span.classList.toggle("two");
      overlay.classList.toggle("active")
    } )
    overlay.addEventListener("click", () => {
      menu.classList.toggle("active");
      span.classList.toggle("two");
      overlay.classList.toggle("active")
    } )
}


// start setting 

// >>>>>>>>>>>>>>>>>>>>> change mode>>>>>>>>>>>>>>>>>>>
let ch = document.getElementById('mode');

// check mode saved
if (window.localStorage.getItem('mode')) {
  //add mode to bdy 
  ch.checked= true;
}
// >>>>>>>>>>>>>>>>>>>>>>>>>> change size >>>>>>>>>>>>>>>>>>>>>>
if (window.localStorage.getItem('size')) {
    document.documentElement.style.fontSize = window.localStorage.getItem('size') + 'px';
  }
// end setting 


// scroll bar 
export function scrollBar(){
  window.addEventListener("scroll", () =>{
    let scroll = document.getElementById("scroller")
    let height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    let scrollTop = window.scrollY;
    scroll.style.height= `${(scrollTop / height) * 100}%`

  })
}