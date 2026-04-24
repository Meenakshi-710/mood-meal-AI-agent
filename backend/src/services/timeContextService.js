function getTimeContext(date) {
  const hours = date.getHours();
  let mealType = "snack";

  if (hours >= 6 && hours < 11) {
    mealType = "breakfast";
  } else if (hours >= 11 && hours < 16) {
    mealType = "lunch";
  } else if (hours >= 16 && hours < 19) {
    mealType = "evening-snack";
  } else if (hours >= 19 && hours < 23) {
    mealType = "dinner";
  }

  return {
    mealType,
    hour: hours,
  };
}

module.exports = { getTimeContext };
