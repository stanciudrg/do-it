import { v4 as uuidv4 } from 'uuid';

// DevCategory factory function. Avoids creating methods on each object by defining them on a separate object
// that is manually set as the prototype.
// Responsible for creating the 'All todos', 'Today', and 'Next 7 days' categories, which are different
// from UserCategories, as they are non-editable and do not require a UUIDV and a creationDate (they do not obey the same logic).
// Todos are automatically added to, deleted from, and moved to and from DevCategories based on their specified, separated logic.
// (eg. a Todo will be added to 'Today' devCategory as soon as the user sets its date to the current date, and the Todo will be
// automatically removed from the 'Today' devCategory as soon as the date has passed or it is manually changed).
export function DevCategory(name, id) {

    const category = Object.create(devCategoryProto);
    category.id = id;
    category.name = name;
    // Array containing all todos
    category.todos = [];
    // Array containing only Todo objects that have their 'filteredOut' property set to true
    category.filteredOutTodos = [];
    // The default sorting of todos
    category.sortingMethod = 'creation-date';
    // The default filtering of todos
    category.filterMethod = 'no-filter';
    // Property that is checked by the Organizer module each time an attempt
    // to change the name of a Category object is made.
    category.editable = false;
    return category;

}

// UserCategory factory function. Uses a generated Universally Unique IDentifier, to allow the Controller, 
// Organizer, and Renderer  modules to communicate the creation, manipulation, or deletion of the UserCategory.
// The uuidv is also used to differentiate UserCategories that share the same name.
export function UserCategory(name) {

    const category = DevCategory(name);
    category.id = uuidv4();
    category.editable = true;
    category.creationDate = new Date().getTime();
    // Creates a new prototype by combining the devCategoryProto
    // and the userCategoryProto, then assigns it to the UserCategory object.
    // This allows for UserCategory to extend the methods of DevCategory.
    const newProto = Object.assign({}, devCategoryProto, userCategoryProto);
    Object.setPrototypeOf(category, newProto);
    return category;

}

export const devCategoryProto = {

    isEditable() { return this.editable },
    getID() { return this.id },
    getTodos() { return this.todos },
    addTodo(todo) { this.todos.push(todo) },
    removeTodo(todo) { this.todos = this.todos.filter(item => item !== todo) },
    getName() { return this.name },
    setSortingMethod(newMethod) { this.sortingMethod = newMethod },
    getCurrentSortingMethod() { return this.sortingMethod },

    // 1. Gets the current sortingMethod property of the Category (defined by the Controller)
    // 2. Uses the sortingMethod property name to access the property of the sortingMethods object
    // 3. The property on the sortingMethods object refers to a function, therefore it calls it.
    // 4. The function returns a sorting function, which is passed to the sort() array method.
    // 5. The sort array method is called on the 'todos' array
    // 6. The updateIndexOfTodos function is called to update the index of each todo
    sort() {

        this.todos.sort(sortingMethods[this.sortingMethod]())
        this.updateIndexOfTodos()

    },

    setFilterMethod(newMethod) { this.filterMethod = newMethod },
    getCurrentFilterMethod() { return this.filterMethod },

    // 1. Goes through the todos of the Category and resets their filteredOut property & resets the filteredOutTodos array
    // 2. Goes through similar steps as the ones described for the sort() method (step 1 to step 4)
    // 3. Stores the filtered todos in the filteredOutTodos array and then sets the property
    // of all filtered todos to 'filteredOut'
    // 4. The updateIndexOfTodos function is called to update their indexes
    filter() {

        this.todos.forEach(todo => todo.set('filteredOut', false));
        this.filteredOutTodos = [];
        this.filteredOutTodos = this.todos.filter(filterMethods[this.filterMethod]());
        this.filteredOutTodos.forEach(todo => todo.set('filteredOut', true));

    },

    updateIndexOfTodos() { this.todos.forEach(todo => todo.set('index', (this.todos.indexOf(todo)))) },

}

export const userCategoryProto = {

    setName(newName) { this.name = newName },
    getCreationDate() { return this.creationDate },

}

export const sortingMethods = {

    // The sorting methods always take into account whether a Todo is also filteredOut, 
    // to keep them at the end of the array.
    'creation-date': function () { return (todoA, todoB) => { return Number(todoA.get('filteredOut')) - Number(todoB.get('filteredOut')) || new Date(todoA.get('creationDate')) - new Date(todoB.get('creationDate')) } },

    'name': function () { return (todoA, todoB) => { return Number(todoA.get('filteredOut')) - Number(todoB.get('filteredOut')) || todoA.get('title').localeCompare(todoB.get('title')) } },

    'due-date': function () {

        return (todoA, todoB) => {

            const A = todoA.get('dueDate') ? new Date(todoA.get('dueDate')) : Infinity;
            const B = todoB.get('dueDate') ? new Date(todoB.get('dueDate')) : Infinity;
            return Number(todoA.get('filteredOut')) - Number(todoB.get('filteredOut')) || A - B;

        }

    },

    'priority': function () {

        return (todoA, todoB) => {

            const A = todoA.get('priority') ? todoA.get('priority') : Infinity;
            const B = todoB.get('priority') ? todoB.get('priority') : Infinity;
            return Number(todoA.get('filteredOut')) - Number(todoB.get('filteredOut')) || A - B;

        }

    },

}

export const filterMethods = {

    'no-filter': function () { return (todo) => todo.get('title') == undefined },
    'priority-one': function () { return (todo) => todo.get('priority') != 1 },
    'priority-two': function () { return (todo) => todo.get('priority') != 2 },
    'priority-three': function () { return (todo) => todo.get('priority') != 3 },
    'completed': function () { return (todo) => todo.get('completedStatus') == false },
    'uncompleted': function () { return (todo) => todo.get('completedStatus') == true },

}