function getExitTime() {
    let mainTable = document.querySelector(`table[id$='_grid_timbrus']`);

    if (mainTable) {
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
                    startTime = (timbrature[i].time < minDate) ? minDate : timbrature[i].time;
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

                                // Se ho sforato l'ora...
                                if ((finePausaPranzo - inizioPausaPranzo) > 3600000) {
                                    // Metto la pausa a 1 ora
                                    finePausaPranzo = new Date(inizioPausaPranzo.getTime());
                                    finePausaPranzo.addHours(1);
                                    //TO-DO, segnala anomalia
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

                            workHours -= rolTime;
                        }

                        endTime.setHours(endTime.getHours() + workHours);
                        var durataPausaPranzo = finePausaPranzo - inizioPausaPranzo;
                        
                        // Se ho fatto meno di mezz'ora di pausa pranzo...
                        if (durataPausaPranzo < 1800000)
                        {
                            //Imposto 30 minuti come durata
                            durataPausaPranzo = 1800000;
                        }
    
                        endTime.setMilliseconds(endTime.getMilliseconds() + durataPausaPranzo);
                        return { date: endTime, lunchTimeMinutes: Math.floor(durataPausaPranzo / 60000), rol: rolTime, isEstimation: false };
                    }
                }
    
                endTime = new Date(startTime.getTime());
                let workHours = 8;

                if (startTime > maxIngresso) {
                    // Ho preso o devo prendere ROL
                    let differenza = startTime - maxIngresso;
                    rolTime = Math.round((differenza / (1000 * 60 * 60)) % 24);
                    workHours -= rolTime;
                }

                endTime.setHours(endTime.getHours() + workHours);
                if (startTime <= pausaStart) {
                    //Calcola su mezz'ora di pausa
                    lunchTimeMinutes = 30;
                    endTime.setMinutes(endTime.getMinutes() + lunchTimeMinutes);
                    return { date: endTime, lunchTimeMinutes: lunchTimeMinutes, rol: rolTime, isEstimation: true };
                }
            }
    
            return { date: endTime, lunchTimeMinutes: lunchTimeMinutes, rol: rolTime, isEstimation: false };
        }
    }
}

function showExitTime() {
    let exitTime = getExitTime();

    if (exitTime) {

        let res_remainingTime;
        let res_timeOfExit;
        let res_timeOfExitTooltip1;
        let res_timeOfExitTooltip1_1;
        let res_timeOfExitTooltip1_2;
        let res_timeOfExitTooltip1_3;
        let res_timeOfExitTooltip2;
        let res_timeOfExitTooltip3;
        let res_timeOfExitTooltip4;
        let res_timeOfExitTooltip5;
        let res_timeOfExitTooltip6;


        if (document.querySelector(`[id$='_Visualizzazionetimbrature_11_portlet_title_lbl_title_openclosetbl']`).innerText === 'Visualizzazione timbrature') {
            res_remainingTime = 'Tempo residuo';
            res_timeOfExit = 'Orario di uscita';
            res_timeOfExitTooltip1 = 'Calcolato';
            res_timeOfExitTooltip1_1 = 'su';
            res_timeOfExitTooltip1_2 = 'senza';
            res_timeOfExitTooltip1_3 = 'minuti di';
            res_timeOfExitTooltip2 = 'pausa pranzo';
            res_timeOfExitTooltip3 = 'e su';
            res_timeOfExitTooltip4 = 'ora';
            res_timeOfExitTooltip5 = 'ore';
            res_timeOfExitTooltip6 = 'di ROL';

        } else {
            res_remainingTime = 'Remaining time';
            res_timeOfExit = 'Time of exit';
            res_timeOfExitTooltip1 = 'Calculated';
            res_timeOfExitTooltip1_1 = 'on';
            res_timeOfExitTooltip1_2 = 'without';
            res_timeOfExitTooltip1_3 = 'minutes of';
            res_timeOfExitTooltip2 = 'lunch break';
            res_timeOfExitTooltip3 = 'and on';
            res_timeOfExitTooltip4 = 'hour';
            res_timeOfExitTooltip5 = 'hours';
            res_timeOfExitTooltip6 = 'of ROL';
        }

        let lunchBreakMessage = `${exitTime.lunchTimeMinutes > 0 ? `${res_timeOfExitTooltip1_1} ${exitTime.lunchTimeMinutes} ${res_timeOfExitTooltip1_3}` : res_timeOfExitTooltip1_2 }`;
        let rolMessage = ` ${res_timeOfExitTooltip3} ${exitTime.rol} ${exitTime.rol == 1 ? res_timeOfExitTooltip4 : res_timeOfExitTooltip5} ${res_timeOfExitTooltip6}`;
        let tooltipMessage = `${res_timeOfExitTooltip1} ${lunchBreakMessage} ${res_timeOfExitTooltip2}${exitTime.rol > 0 ? rolMessage : ''}.`;
        
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
                    margin: 0 0 0 30px;
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

                 .x-circle {
                    margin: 0 4px;
                    border-radius: 25px;
                    width: 7px;
                    height: 7px;
                    background: #20bb51;
                 }

                 .x-warning {
                    background: #FFA500;
                 }
             </style>
             <div class="x-flex">
                 <div class="x-flex-item" style="flex: 33%; border-right: 1px solid #e3e3e3;" title="${tooltipMessage}">
                     <div class="x-title">
                        <span>${res_timeOfExit}</span>
                        <div class="x-circle ${exitTime.isEstimation ? "x-warning" : "" }"></div>
                     </div>
                     <div>
                         <span class="x-lg-text x-bold">${String(exitTime.date.getHours()).padStart(2, "0")}</span>
                         <span class="x-lg-text">:${String(exitTime.date.getMinutes()).padStart(2, "0")}</span>
                     </div>
                 </div>
                 <div class="x-flex-item" style="flex: 66%;">
                     <div class="x-title">${res_remainingTime}</div>
                     <div style="width: 100%;">
                         <span class="x-lg-text" id="x-countdown"></span>
                     </div>
                 </div>
             </div><hr style="border: 1px solid #e3e3e3; margin: 18px;">`;
        const node = template.content.cloneNode(true);
        document.querySelector('[ps-resource-name="Visualizzazionetimbrature_11"]').prepend(node);

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

showExitTime();