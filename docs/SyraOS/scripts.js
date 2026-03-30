document.addEventListener("DOMContentLoaded", function(){
  var yearEl = document.getElementById("year");
  if(yearEl) yearEl.textContent = new Date().getFullYear();
  var btn = document.getElementById("menu-btn");
  var menu = document.getElementById("menu");
  if(btn && menu){
    btn.addEventListener("click", function(){
      menu.classList.toggle("open");
    });
  }

  // Terminal typing animation
  var demoLines = document.querySelectorAll(".line-input, .line-output");
  if(demoLines.length > 0){
    var observer = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting && !entry.target.style.opacity){
          entry.target.style.opacity = "1";
        }
      });
    }, { threshold: 0.5 });

    demoLines.forEach(function(line){
      line.style.opacity = "0";
      observer.observe(line);
    });
  }
});