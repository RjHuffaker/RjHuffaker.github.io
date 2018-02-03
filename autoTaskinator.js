
    'use strict';
    /*jshint esnext: true */


    export default function autoTaskinator(){
        console.log("autoTaskinating");

        var ordersTable = document.getElementById("OrdersTable");
        var ordersTableRows = null;
        if(ordersTable){
            ordersTableRows = ordersTable.children[0].children;

            for(var i = 0; i < ordersTableRows.length; i++){
                var container = document.createElement("td");
                container.style.width = "64px";

                ordersTableRows[i].insertBefore(container, ordersTableRows[i].firstChild);

                if(!ordersTableRows[i].classList.contains("noncollapsible")){
                    var button1 = document.createElement("button");
                    var button2 = document.createElement("button");

                    button1.innerHTML = "S";
                    button1.style.minWidth = "0px";
                    button1.style.width = "32px";
                    button1.style.display = "inline";
                    button2.innerHTML = "F";
                    button2.style.minWidth = "0px";
                    button2.style.width = "32px";
                    button2.style.display = "inline";

                    button1.id = "setupTask"+i;
                    button2.id = "followUpTask"+i;
                    container.appendChild(button1);
                    container.appendChild(button2);

                    button1.addEventListener("click", function(e) {
                        e.stopPropagation();
                        var addTask = document.getElementById("addTask");
                        var collapsedAddTask = document.getElementById("collapsedAddTask");
                        var row = e.target.id.replace("setupTask","");

                        if(addTask){
                            addTask.click();
                        } else {
                            collapsedAddTask.click();
                        }

                        createSetupTask(row);
                        console.log(row);

                        console.log(retrieveServiceOrder(row));
                    });

                    button2.addEventListener("click", function(e) {
                        e.stopPropagation();
                        var addTask = document.getElementById("addTask");
                        var collapsedAddTask = document.getElementById("collapsedAddTask");
                        var row = e.target.id.replace("followUpTask","");

                        if(addTask){
                            addTask.click();
                        } else {
                            collapsedAddTask.click();
                        }

                        createFollowUpTask(row);

                    });


                }
            }
        }

        function retrieveServiceOrder(row){
            var serviceOrder = {};

            if(!ordersTableRows[row].classList.contains("noncollapsible")){
                var orderColumns = ordersTableRows[row].children;

                serviceOrder.id = orderColumns[3].children[0].innerHTML.trim();
                serviceOrder.date = orderColumns[4].innerHTML.slice(14,22);
                serviceOrder.tech = orderColumns[9].children[0].innerHTML.trim().replace("&nbsp;","");
                serviceOrder.service = orderColumns[10].children[0].innerHTML.trim();

                serviceOrder.instructions = ordersTableRows[row].getAttribute("popuptext").replace(/<\/?[^>]+(>|$)/g, "").split("Location Instructions:&nbsp;").pop();
            }

            return serviceOrder;
        }

        function createSetupTask(row){
            var serviceOrder = retrieveServiceOrder(row);

            var taskNameInput = document.getElementById("subject");
            var prioritySelect = document.getElementById("priority");
            var taskTypeSelect = document.getElementById("taskType");
            var dueDateInput = document.getElementById("dueDate");
            var taskForButton = document.getElementById("selectTaskFor");

            switch (serviceOrder.service){
                case "BED BUGS":
                    prioritySelect.value = "3";
                    taskTypeSelect.value = "12";
                    dueDateInput.value = getFutureDate(serviceOrder.date, 1);
                    taskNameInput.value = "Generate follow-up for Bed Bugs on "+getFutureDate(serviceOrder.date, 14);
                    break;
                case "FREE ESTIMATE":
                    prioritySelect.value = "3";
                    taskTypeSelect.value = "16";
                    taskNameInput.value = "New $?? ";
                    break;
                case "FREE ESTIMATE C":
                    console.log("TODO: Do commercial estimate stuff.");
                    break;
                case "IN":
                    prioritySelect.value = "3";
                    taskTypeSelect.value = "16";
                    dueDateInput.value = getFutureDate(serviceOrder.date, 1);
                    break;
                case "RE-START":
                    prioritySelect.value = "3";
                    taskTypeSelect.value = "16";
                    dueDateInput.value = getFutureDate(serviceOrder.date, 1);
                    break;
                case "ROACH":
                    prioritySelect.value = "3";
                    taskTypeSelect.value = "12";
                    dueDateInput.value = getFutureDate(serviceOrder.date, 1);
                    taskNameInput.value = "Generate 2 more GR treatments @ $100 ea";
                    break;
                case "TICK":
                    prioritySelect.value = "3";
                    taskTypeSelect.value = "12";
                    dueDateInput.value = getFutureDate(serviceOrder.date, 1);
                    taskNameInput.value = "Generate 1 more Tick treatment on "+getFutureDate(serviceOrder.date, 14);
                    break;
                default:
                    console.log("TODO: Don't know what to do with this.");
            }

            if(serviceOrder.instructions.indexOf("45mo") > -1){
                taskNameInput.value = "New $45M ";
            } else if(serviceOrder.instructions.indexOf("49mo") > -1){
                taskNameInput.value = "New $49M ";
            } else if(serviceOrder.instructions.indexOf("55mo") > -1){
                taskNameInput.value = "New $55M ";
            } else if(serviceOrder.instructions.indexOf("60mo") > -1){
                taskNameInput.value = "New $60M ";
            } else if(serviceOrder.instructions.indexOf("55eom") > -1){
                taskNameInput.value = "New $55B ";
            } else if(serviceOrder.instructions.indexOf("65eom") > -1){
                taskNameInput.value = "New $65B ";
            } else if(serviceOrder.instructions.indexOf("69eom") > -1){
                taskNameInput.value = "New $69B ";
            } else if(serviceOrder.instructions.indexOf("75eom") > -1){
                taskNameInput.value = "New $75B ";
            } else if(serviceOrder.instructions.indexOf("79eom") > -1){
                taskNameInput.value = "New $79B ";
            }

        }

        function createFollowUpTask(row){
            var serviceOrder = retrieveServiceOrder(row);
            var taskNameInput = document.getElementById("subject");
            var prioritySelect = document.getElementById("priority");
            var taskTypeSelect = document.getElementById("taskType");
            var dueDateInput = document.getElementById("dueDate");
            var taskForButton = document.getElementById("selectTaskFor");

            prioritySelect.value = "2";
            taskNameInput.value = "Follow up for initial";
            taskTypeSelect.value = "16";
            dueDateInput.value = getFutureDate(serviceOrder.date, 14);
        }

        function getFutureDate(startDate, daysOut){
            var newDate = new Date(startDate);
            newDate.setDate(newDate.getDate() + daysOut);
            var dd = newDate.getDate();
            var mm = newDate.getMonth()+1;
            var yy = newDate.getFullYear();
            return mm+"/"+dd+"/"+yy;
        }
    }