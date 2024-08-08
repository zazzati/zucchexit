if (!String.prototype.format) {
    String.prototype.format = function() {
      var args = arguments;
      return this.replace(/{(\d+)}/g, function(match, number) { 
        return typeof args[number] != 'undefined'
          ? args[number]
          : match
        ;
      });
    };
  }

function nearestMultipleOf15(num) {
    // Calcola il multiplo di 15 più vicino
    let lowerMultiple = Math.floor(num / 15) * 15;
    let upperMultiple = Math.ceil(num / 15) * 15;

    if (lowerMultiple == 0) {
        lowerMultiple = upperMultiple;
    }

    // Restituisce il multiplo più vicino
    return (num - lowerMultiple < upperMultiple - num) ? lowerMultiple : upperMultiple;
}

function getExitTime() {
    let messages = [];
    let mainTable = document.querySelector(`table[id$='_grid_timbrus']`);

    if (mainTable) {
        let isItalian = document.querySelector(`[id$='_Visualizzazionetimbrature_11_portlet_title_lbl_title_openclosetbl']`).innerText === 'Visualizzazione timbrature';

        let resLessThan30Min = isItalian ? 'Hai fatto {0} minuti di pausa pranzo.' : `You had a {0} minutes lunch break.`;
        let ressMoreThan1Hour = isItalian ? 'Hai fatto {0} minuti di pausa pranzo! Orario di uscita calcolato su 60 minuti di pausa ma saranno conteggiati {1} minuti di minor presenza.' :
            `You had a {0} minutes lunch break! Time of exit calculated on 60 minutes of lunch break but there will be {1} minutes of lower attendance.`;
        let resROL = isItalian ? `L'orario di uscita è calcolato su {0} ore di ROL.` : 
            `Time of exit calculated on {0} hours of ROL.`;
        let resLunchBreak = isItalian ? `L'orario di uscita è calcolato su {0} minuti di pausa pranzo.` :
            `Time of exit calculated on {0} minutes of lunch break.`;
        let resIsEstimation = isItalian ? `L'orario di uscita definitivo verrà mostrato dopo la pausa pranzo.` :
            `The final time of exit will be shown after the lunch break.`
        let resBefore730 = isItalian ? `L'orario di ingresso usato per il calcolo è 7:30.` :
            `The time of entry used for the calculation is 7:30.`;
        var timbrature = Array.from(mainTable.querySelectorAll('tbody>tr[lookupcells="1"]')).map((x) => { 
            var time = x.querySelectorAll(':nth-child(3)')[0].innerText;
            var date = new Date();
            date.setHours(time.substring(0, 2),time.substring(3),0,0)
            
            return {
            direction: x.querySelectorAll('.blue').length ? 'IN' : 'OUT',
            time: date
        }});
    
        if (timbrature && timbrature.length) {
            let i = 0;
            let found = false;
            let startTime;
            let endTime;
            let rolTime = 0;
            let lunchTimeMinutes = 0;

            let minDate = new Date();
            minDate.setHours(7, 30, 0, 0);

            let pausaStart = new Date();
            pausaStart.setHours(12, 0, 0, 0);

            let maxIngresso = new Date();
            maxIngresso.setHours(10, 0, 0, 0);
    
            //Cerca la data di inizio
            do {
                if (timbrature[i].direction === 'IN') {

                    // Se ho timbrato prima delle 7:30, imposto 7:30 come orario base
                    if (timbrature[i].time < minDate) {
                        messages.push({ icon: 'warn', message: resBefore730 });
                        startTime = minDate;
                    } else {
                        startTime = timbrature[i].time;
                    }
                    
                    found = true;
                } else {
                    i++;
                }
            } while (!found && i < timbrature.length);
    
            //Se ho trovato la data di inizio...
            if (startTime) 
            {
                //Se ho bollato l'uscita...
                if (timbrature.slice(i).some(x=> x.direction === 'OUT')) {
                    found = false;
                    let inizioPausaPranzo;
                    let finePausaPranzo;
    
                    //Cerca la data di uscita (inizio pausa pranzo)
                    do {
                        if (timbrature[i].direction === 'OUT' && timbrature[i].time >= pausaStart) {
                            inizioPausaPranzo = timbrature[i].time;
                            found = true;
                        }
                        else {
                            i++;
                        }
                    } while (!found && i < timbrature.length);
        
                    if (inizioPausaPranzo) {
                        found = false;

                        //Cerca la data di rientro (fine pausa pranzo)
                        do {
                            if (timbrature[i].direction === 'IN') {
                                finePausaPranzo = timbrature[i].time;
                                let diff = finePausaPranzo - inizioPausaPranzo;
                                // Se ho sforato l'ora...
                                if (diff > 3600000) {
                                    messages.push({ icon: 'error', message: ressMoreThan1Hour.format(Math.floor(diff / 60000), Math.floor(nearestMultipleOf15(Math.floor((diff - 3600000) / 60000)))) });

                                    // Metto la pausa a 1 ora
                                    finePausaPranzo = new Date(inizioPausaPranzo.getTime());
                                    finePausaPranzo.setHours(finePausaPranzo.getHours() + 1);
                                } else {
                                    finePausaPranzo = timbrature[i].time;
                                }

                                found = true;
                            }else {
                                i++;
                            }
                        } while (!found && i < timbrature.length);
                    }
    
                    // Se so quando sono rientrato dalla pausa pranzo...
                    if (finePausaPranzo) {            
                        endTime = new Date(startTime.getTime());
                        let workHours = 8;

                        if (startTime > maxIngresso) {
                            // Ho preso o devo prendere ROL
                            let differenza = startTime - maxIngresso;
                            rolTime = (differenza / (1000 * 60 * 60)) % 24;
                            rolTime = rolTime % 1 != 0 ? Math.floor(rolTime) + 1 : Math.floor(rolTime);
                            messages.push({ icon: 'warn', message: resROL.format(rolTime) });

                            workHours -= rolTime;
                        }

                        endTime.setHours(endTime.getHours() + workHours);
                        var durataPausaPranzo = finePausaPranzo - inizioPausaPranzo;
                        
                        // Se ho fatto meno di mezz'ora di pausa pranzo...
                        if (durataPausaPranzo < 1800000)
                        {                           
                            messages.push({ icon: 'warn', message: resLessThan30Min.format(Math.floor(durataPausaPranzo / 60000)) }); 
                            //Imposto 30 minuti come durata
                            durataPausaPranzo = 1800000;
                        }
    
                        endTime.setMilliseconds(endTime.getMilliseconds() + durataPausaPranzo);
                        let lunchTimeMinutes = Math.floor(durataPausaPranzo / 60000);
                        messages.push({ icon: 'info', message: resLunchBreak.format(lunchTimeMinutes) });
                        return { date: endTime, lunchTimeMinutes: lunchTimeMinutes, rol: rolTime, isEstimation: false, messages };
                    }
                }
    
                endTime = new Date(startTime.getTime());
                let workHours = 8;

                if (startTime > maxIngresso) {
                    // Ho preso o devo prendere ROL
                    let differenza = startTime - maxIngresso;
                    rolTime = Math.round((differenza / (1000 * 60 * 60)) % 24);
                    messages.push({ icon: 'warn', message: resROL.format(rolTime) });

                    workHours -= rolTime;
                }

                endTime.setHours(endTime.getHours() + workHours);
                if (startTime <= pausaStart) {
                    //Calcola su mezz'ora di pausa
                    lunchTimeMinutes = 30;
                    endTime.setMinutes(endTime.getMinutes() + lunchTimeMinutes);
                    messages.push({ icon: 'warn', message: resIsEstimation });
                    return { date: endTime, lunchTimeMinutes: lunchTimeMinutes, rol: rolTime, isEstimation: true, messages };
                }
            }
    
            return { date: endTime, lunchTimeMinutes: lunchTimeMinutes, rol: rolTime, isEstimation: false, messages };
        }
    }
}

function showExitTime() {
    let exitTime = getExitTime();

    if (exitTime) {

        let res_remainingTime;
        let res_timeOfExit;

        if (document.querySelector(`[id$='_Visualizzazionetimbrature_11_portlet_title_lbl_title_openclosetbl']`).innerText === 'Visualizzazione timbrature') {
            res_remainingTime = 'Tempo residuo';
            res_timeOfExit = 'Orario di uscita';

        } else {
            res_remainingTime = 'Remaining time';
            res_timeOfExit = 'Time of exit';
        }

        const template = document.createElement("template");
        template.innerHTML = 
            `<style>
                 .x-lg-text {
                     font-size: 40px;
                     font-family: Proxima Nova !important;
                     color: #343434;
                 }
 
                 .x-md-text {
                     font-size: 28px;
                 }
 
                 .x-bold {
                     font-weight: 600;
                 }
 
                 .x-flex {
                     display: flex;
                 }
 
                 .x-flex-item {
                    display: flex;
                    justify-content: center;
                    align-items: start;
                    flex-direction: column;
                    padding: 0 0 0 30px;
                 }

                 .x-flex-item.single {
                    align-items: center;
                    margin: 0;
                 }
 
                 .x-title {
                     font-size: 14px !important;
                     font-family: Proxima Nova !important;
                     font-weight: 600 !important;
                     text-shadow: none !important;
                     color: #777 !important;
                     text-align: center !important;
                     display: flex;
                     justify-content: center;
                     align-items: center;
                 }

                 .x-messages {
                    margin: 0px 0px 5px 0px;
                 }

                 .x-message {
                    display: flex;
                    align-items: center;
                    padding: 5px;
                    border-bottom: 1px solid #e3e3e3;
                    font-size: 13px;
                    font-family: 'Segoe UI', 'Proxima Nova';
                    font-weight: 600;
                    color: #5d5d5d;
                 }

                 .x-icon {
                    width: 8px;
                    height: 8px;
                    border-radius: 50px;
                    margin-right: 5px;
                 }

                 .x-warn {
                    background: #FFA500;
                 }

                 .x-info {
                    background: #35c464;
                    font-weight: normal;
                    font-size: 13px;
                 }

                 .x-error {
                    background: #e64c4c;
                 }
             </style>
             <div class="x-flex">
                 <div class="x-flex-item ${exitTime.isEstimation ? 'single' : ''}" style="flex: 33%;">
                     <div class="x-title">
                        <span>${res_timeOfExit}</span>
                     </div>
                     <div>
                         <span class="x-lg-text x-bold">${String(exitTime.date.getHours()).padStart(2, "0")}</span>
                         <span class="x-lg-text">:${String(exitTime.date.getMinutes()).padStart(2, "0")}</span>
                         ${renderEstimatedTo(exitTime.isEstimation, exitTime.date)}
                     </div>
                 </div>
                 ${renderCountdown(!exitTime.isEstimation, res_remainingTime)}
             </div>
             <div class="x-messages">
                ${renderMessages(exitTime.messages)}
             </div>`;
        const node = template.content.cloneNode(true);
        document.querySelector('[ps-resource-name="Visualizzazionetimbrature_11"]').prepend(node);

        if (!exitTime.isEstimation) {
            var countDownDate = exitTime.date;

            var x = setInterval(function() {
                var now = new Date().getTime();
                var distance = countDownDate - now;
    
                var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                var seconds = Math.floor((distance % (1000 * 60)) / 1000);
    
                if (distance < 0) {
                    clearInterval(x);
                    hours = 0;
                    minutes = 0;
                    seconds = 0;
                }
    
                document.getElementById("x-countdown").innerHTML = 
                    `<span class="x-bold">${hours}h </span><span>${minutes}m </span><span class="x-md-text">${seconds}s</span>`;
            }, 1000);
        }
    }
}

function renderCountdown(render, res_remainingTime) {
    return render ? `<div class="x-flex-item" style="flex: 66%; border-left: 1px solid #e3e3e3;">
            <div class="x-title">${res_remainingTime}</div>
            <div style="width: 100%;">
                <span class="x-lg-text" id="x-countdown"></span>
            </div>
        </div>` : ``;

}

function renderEstimatedTo(isEstimation, date) {
    if (isEstimation) {
        date.setMinutes(date.getMinutes() + 30);
        return `<span class="x-lg-text"> - </span>
        <span class="x-lg-text x-bold">${String(date.getHours()).padStart(2, "0")}</span>
        <span class="x-lg-text">:${String(date.getMinutes()).padStart(2, "0")}</span>`
    }

    return ``;
}

function renderMessages(messages) {
    let html = '';

    messages.forEach(x => {
        html += `<div class="x-message"><div><div class="x-icon x-${x.icon}"></div></div><div><span>${x.message}</span></div></div>`
    });

    return html;
}

showExitTime();
