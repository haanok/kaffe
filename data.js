// Catalog estimates per serving. Brand, recipe, and preparation can vary.
export const CATEGORIES = [
  ['all', 'Everything'], ['coffee', 'Coffee'], ['tea', 'Tea'],
  ['energy', 'Energy'], ['soda', 'Soda'], ['supp', 'Supplements'], ['sweets', 'Sweets'],
];
export const DRINKS = [
  ['espresso', 'Espresso shot', 'coffee', 64, 3, '30 ml'],
  ['dbl-espresso', 'Double espresso', 'coffee', 128, 6, '60 ml'],
  ['drip', 'Drip coffee', 'coffee', 95, 5, '240 ml'],
  ['cold-brew', 'Cold brew', 'coffee', 200, 5, '350 ml'],
  ['americano', 'Americano', 'coffee', 95, 10, '240 ml'],
  ['latte', 'Latte', 'coffee', 75, 120, '350 ml'],
  ['cappuccino', 'Cappuccino', 'coffee', 75, 80, '180 ml'],
  ['flat-white', 'Flat white', 'coffee', 130, 110, '180 ml'],
  ['mocha', 'Mocha', 'coffee', 95, 290, '350 ml'],
  ['decaf', 'Decaf coffee', 'coffee', 5, 5, '240 ml'],
  ['matcha', 'Matcha latte', 'tea', 70, 130, '350 ml'],
  ['green-tea', 'Green tea', 'tea', 35, 0, '240 ml'],
  ['black-tea', 'Black tea', 'tea', 47, 2, '240 ml'],
  ['earl-grey', 'Earl Grey', 'tea', 40, 2, '240 ml'],
  ['yerba-mate', 'Yerba mate', 'tea', 85, 5, '240 ml'],
  ['red-bull', 'Red Bull', 'energy', 80, 110, '250 ml'],
  ['rb-sugarfree', 'Red Bull Sugar-free', 'energy', 80, 5, '250 ml'],
  ['monster', 'Monster Original', 'energy', 160, 230, '500 ml'],
  ['monster-zero', 'Monster Zero Ultra', 'energy', 150, 10, '500 ml'],
  ['celsius', 'Celsius', 'energy', 200, 10, '350 ml'],
  ['bang', 'Bang Energy', 'energy', 300, 0, '470 ml'],
  ['coke', 'Coca-Cola', 'soda', 34, 140, '330 ml'],
  ['diet-coke', 'Diet Coke', 'soda', 46, 0, '330 ml'],
  ['pepsi', 'Pepsi', 'soda', 38, 150, '330 ml'],
  ['mtn-dew', 'Mountain Dew', 'soda', 54, 170, '330 ml'],
  ['preworkout', 'Pre-workout scoop', 'supp', 200, 5, '1 scoop'],
  ['caf-pill', 'Caffeine pill 200', 'supp', 200, 0, '1 tablet'],
  ['caf-pill-100', 'Caffeine pill 100', 'supp', 100, 0, '1 tablet'],
  ['dark-choc', 'Dark chocolate', 'sweets', 24, 170, '30 g'],
  ['mocha-icecream', 'Coffee ice cream', 'sweets', 30, 220, '100 g'],
].map(([id, name, cat, mg, kcal, serving]) => ({ id, name, cat, mg, kcal, serving }));
export const DRINK_BY_ID = Object.fromEntries(DRINKS.map(d => [d.id, d]));
export const QUICK = ['drip', 'dbl-espresso', 'latte', 'matcha', 'cold-brew', 'monster-zero'];
export const INGREDIENTS = [
  ['espresso', 'Espresso', 'Coffee', '#78442c', 64, 3],
  ['hot-water', 'Hot water', 'Base', '#dfcaa0', 0, 0],
  ['cold-water', 'Cold water', 'Base', '#a9d8ed', 0, 0],
  ['steamed-milk', 'Steamed milk', 'Milk', '#f3dfbd', 0, 80],
  ['milk-foam', 'Milk foam', 'Milk', '#fff4db', 0, 10],
  ['cold-milk', 'Cold milk', 'Milk', '#f9eadb', 0, 80],
  ['ice', 'Ice', 'Extra', '#c6e9ef', 0, 0],
  ['chocolate', 'Chocolate', 'Syrup', '#56382d', 5, 100],
  ['vanilla', 'Vanilla', 'Syrup', '#e7bb63', 0, 80],
  ['matcha', 'Matcha', 'Tea', '#90aa69', 35, 5],
  ['whipped', 'Whipped cream', 'Topping', '#fff7ec', 0, 60],
].map(([id, name, cat, color, mg, kcal]) => ({ id, name, cat, color, mg, kcal }));
export const ING_BY_ID = Object.fromEntries(INGREDIENTS.map(i => [i.id, i]));
export const RECIPES = [
  ['Espresso', 'Pure shot. No frills.', 'espresso', ['espresso']],
  ['Double Espresso', 'Twice the character.', 'dbl-espresso', ['espresso', 'espresso']],
  ['Americano', 'A little more room to linger.', 'americano', ['espresso', 'hot-water']],
  ['Iced Americano', 'Espresso on the rocks.', 'americano', ['espresso', 'hot-water', 'ice']],
  ['Cappuccino', 'Coffee, milk, and a fluffy hat.', 'cappuccino', ['espresso', 'steamed-milk', 'milk-foam']],
  ['Latte', 'A milky hug in a mug.', 'latte', ['espresso', 'steamed-milk', 'steamed-milk']],
  ['Flat White', 'Double shot, velvet finish.', 'flat-white', ['espresso', 'espresso', 'milk-foam']],
  ['Mocha', 'Where coffee meets dessert.', 'mocha', ['espresso', 'steamed-milk', 'chocolate']],
  ['Iced Latte', 'Cool, creamy, classic.', 'latte', ['espresso', 'ice', 'cold-milk']],
  ['Vanilla Latte', 'A sweet little plot twist.', 'latte', ['espresso', 'vanilla', 'steamed-milk']],
  ['Mocha Deluxe', 'The one with a cloud on top.', 'mocha', ['espresso', 'steamed-milk', 'chocolate', 'whipped']],
  ['Matcha Latte', 'A greener kind of afternoon.', 'matcha', ['matcha', 'steamed-milk']],
  ['Matcha Tea', 'Keeping it green and simple.', 'green-tea', ['matcha', 'hot-water']],
  ['Cold-Brew Style', 'An iced espresso riff, not true cold brew.', 'cold-brew', ['espresso', 'cold-water', 'ice']],
  ['Iced Double Latte', 'Big chill, double shot.', 'latte', ['espresso', 'espresso', 'ice', 'cold-milk']],
  ['Macchiato', 'Just a little mark of foam.', 'espresso', ['espresso', 'milk-foam']],
  ['Cortado', 'Small cup, balanced character.', 'latte', ['espresso', 'cold-milk']],
  ['Triple Shot', 'Three shots, one little cup.', 'dbl-espresso', ['espresso', 'espresso', 'espresso']],
  ['Wet Cappuccino', 'Cappuccino, a little milkier.', 'cappuccino', ['espresso', 'steamed-milk', 'steamed-milk', 'milk-foam']],
  ['Vanilla Cappuccino', 'A sweet whisper under the foam.', 'cappuccino', ['espresso', 'steamed-milk', 'milk-foam', 'vanilla']],
  ['Vanilla Americano', 'A classic, dressed up.', 'americano', ['espresso', 'hot-water', 'vanilla']],
  ['Iced Mocha', 'Chocolate with a cool side.', 'mocha', ['espresso', 'cold-milk', 'chocolate', 'ice']],
  ['Iced Matcha', 'Green, cold, and creamy.', 'matcha', ['matcha', 'cold-milk', 'ice']],
  ['Vanilla Matcha', 'Earthy meets sweet.', 'matcha', ['matcha', 'steamed-milk', 'vanilla']],
  ['Mocha Whip', 'Espresso, chocolate, cloud.', 'mocha', ['espresso', 'chocolate', 'whipped']],
  ['Espresso Con Panna', 'A shot with a dollop of cream.', 'espresso', ['espresso', 'whipped']],
  ['Mocha Macchiato', 'A tiny chocolate escape.', 'mocha', ['espresso', 'milk-foam', 'chocolate']],
].map(([name, tagline, drinkId, ing]) => ({ name, tagline, drinkId, ing }));
export const MAX_LAYERS = 6;
export const blendKey = ids => [...ids].sort().join('|');
export const matchRecipe = ids => RECIPES.find(r => blendKey(r.ing) === blendKey(ids)) || null;
export function blendTotals(ids) {
  return ids.reduce((sum, id) => ({ mg: sum.mg + ING_BY_ID[id].mg, kcal: sum.kcal + ING_BY_ID[id].kcal }), { mg: 0, kcal: 0 });
}
