import { v4 as uuidv4 } from "uuid";

const nonEditableProperties = ["id", "creationDate"];

export const todoProto = {
  get(property) {
    return this[property];
  },
  set(property, newValue) {
    // Prevents the modification of Todo's Universally Unique IDentifier and creationDate
    if (
      nonEditableProperties.find(
        (nonEditableProperty) => nonEditableProperty === property,
      )
    )
      return;
    this[property] = newValue;
  },
  // Whether the Todo has more properties than it's title, which is required by default.
  hasAdditionalInfo() {
    return this.description || this.priority || this.dueDate || this.categoryID;
  },
  toggleCompletedStatus() {
    this.completedStatus = !this.completedStatus;
  },
};

// Todo factory function. Avoids creating methods on each object by defining them on a separate object
// that is manually set as the prototype.
export function Todo(
  title,
  description,
  priority,
  dueDate,
  miniDueDate,
  categoryID,
  categoryName,
) {
  const todo = Object.create(todoProto);
  // Index used for connecting the todo object with the todo DOM element for sorting
  // reasons only (todoObj.index == todoDOM.dataset.index). Gets updated by the DevCategory
  // and/or UserCategory objects when sorting their containing todos.
  todo.index = null;
  // Signifies whether the todo is filtered out due to a filter method applied by DevCategory and/or UserCategory objects.
  todo.filteredOut = false;
  // Universally Unique IDentifier. The most important property of the Todo, thoroughly used by the Controller,
  // Organizer, and Renderer modules to communicate the creation, manipulation,
  // or deletion of the Todo. It is also used to differentiate todos that share similar features and
  // would be otherwise "indistinguishable" in certain scenarios.
  todo.id = uuidv4();
  todo.title = title || "";
  todo.description = description || "";
  todo.priority = priority || "";
  // dueDate contains the complete, parsed date format (YYYY-MM-DD)
  todo.dueDate = dueDate || "";
  // miniDueDate contains the simplified, human readable date format (eg. 'today', 'monday', '03 feb')
  todo.miniDueDate = miniDueDate || "";
  // The ID and Name of the UserCategory that holds the todo in its 'todos' array. A todo can be held by only
  // one userCategory at a time.
  todo.categoryID = categoryID || "";
  todo.categoryName = categoryName || "";
  // Whether the todo has been marked as 'completed' by the user.
  todo.completedStatus = false;
  // The moment when the Todo was created by the user. Used in the 'creation-date' default sorting method of
  // DevCategory and/or UserCategory objects.
  todo.creationDate = new Date();
  // Signifies that the Todo dueDate has passed. It is automatically set to 'true'
  // by the Controller when the condition is met
  todo.overdueStatus = false;
  return todo;
}
