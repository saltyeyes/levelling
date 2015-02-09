if (!String.prototype.format) {
  String.prototype.format = function() {
    var args = arguments;
    return this.replace(/\$(\d+)/g, function(match, number) { 
      return typeof args[number] != 'undefined'
        ? args[number]
        : match
      ;
    });
  };
}
ko.bindingHandlers.uniqueId = {
	init: function(element, valueAccessor) {
		var value = valueAccessor();
		value.id = value.id || ko.bindingHandlers.uniqueId.prefix + (++ko.bindingHandlers.uniqueId.counter);

		element.id = value.id;
	},
	counter: 0,
	prefix: "unique"
};

ko.bindingHandlers.uniqueFor = {
	init: function(element, valueAccessor) {
		var value = valueAccessor();
		value.id = value.id || ko.bindingHandlers.uniqueId.prefix + (++ko.bindingHandlers.uniqueId.counter);
		
		element.setAttribute("for", value.id);
	} 
};

ko.extenders.numeric = function(target, precision) {
    //create a writable computed observable to intercept writes to our observable
    var result = ko.pureComputed({
        read: target,  //always return the original observables value
        write: function(newValue) {
            var current = target(),
                roundingMultiplier = Math.pow(10, precision),
                newValueAsNum = isNaN(newValue) ? 0 : parseFloat(+newValue),
                valueToWrite = Math.round(newValueAsNum * roundingMultiplier) / roundingMultiplier;
 
            //only write if it changed
            if (valueToWrite !== current) {
                target(valueToWrite);
            } else {
                //if the rounded value is the same, but a different value was written, force a notification for the current field
                if (newValue !== current) {
                    target.notifySubscribers(valueToWrite);
                }
            }
        }
    }).extend({ notify: 'always' });
 
    //initialize with current value to make sure it is rounded appropriately
    result(target());
 
    //return the new computed observable
    return result;
};

var levelCosts = [1000,1000,1000,1000,1000,2000,2000,2000,3000,4000,6000,6000,8000,8000,10000,10000,10000,10000,12000,12000,14000,14000,16000,16000];

function Dragon(id) {
	var self = this;
	self.id = ko.observable(id ? id : 0).extend({numeric: 0});
	self.currentLevel = ko.observable(1).extend({numeric: 0});
	self.goalLevel = ko.observable(1).extend({numeric: 0});
	self.cost = ko.computed(function() {
		if (self.currentLevel() < 1 || self.goalLevel() < 1 || self.currentLevel() == self.goalLevel()) {
			return 0;
		}
		// console.log(self.currentLevel);
		var total = 0;
		for (var i = self.currentLevel(); i < self.goalLevel(); i++) {
			total += levelCosts[i-1];
		}
		console.log("Cost: " + total);
		return total;
	});
	self.image = ko.computed(function() {
		return "http://flightrising.com/rendern/avatars/$0/$1.png".format(Math.ceil(self.id()/100 + 0.5), self.id());
	});
	self.bbcode = ko.computed(function () {
		return "[url=http://flightrising.com/main.php?dragon=$0][img]$1[/img][/url]\n[b]from levels $2 to $3[/b]".format(self.id(), self.image(), self.currentLevel(), self.goalLevel());
	});
}

function DragonListModel() {
	var self = this;
	self.dragons = ko.observableArray([]);
	self.addDragon = function() {
		self.dragons.push(new Dragon());
		$('[data-toggle="tooltip"]').tooltip();
	}
	self.removeDragon = function(dragon) { 
		self.dragons.remove(dragon);
	}
	self.totalCost = ko.computed(function() {
		var total = 0;
		for (var i = 0; i < self.dragons().length; i++) {
			total += self.dragons()[i].cost();
		}
		// console.log("Total Cost: " + total);
		return total;
	});
	self.displayTotalCost = ko.computed(function() {
		return self.totalCost().toString().replace(/\d(?=(\d{3})+$)/g, '$&,') + "T";
	});
	self.displayOutput = ko.computed(function() {
		var out = "I'd like to have the following dragons trained:", valid = false;
		for (var d in self.dragons()) {
			var dragon = self.dragons()[d];
			window.dragon = dragon;
			if (dragon.id() > 0 && dragon.currentLevel() < dragon.goalLevel()) {
				valid = true;
				out += "\n$0\n".format(dragon.bbcode());
			}
		}
		console.log(valid, out);
		return valid ? out : "";
	});
	self.validDragons = ko.computed(function() {
		var count = 0;
		for (var d in self.dragons()) {
			var dragon = self.dragons()[d];
			if (dragon.id() > 0 && dragon.currentLevel() < dragon.goalLevel()) {
				count += 1;
			}
		}
		return count;
	});
}

$(function () {
	var model = new DragonListModel();
	ko.applyBindings(model);
	model.addDragon();
});