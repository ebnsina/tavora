import {
	BirthdayCakeIcon,
	ChickenThighsIcon,
	Coffee01Icon,
	DrinkIcon,
	FrenchFries01Icon,
	Hamburger01Icon,
	IceCream01Icon,
	NoodlesIcon,
	Pizza01Icon,
	RiceBowl01Icon,
	SandwichIcon,
	SoupIcon
} from '@hugeicons/core-free-icons';
import type { TickerIcon } from '$lib/api';

// The food icons the ticker can use; keys match tickerIcons in api/content.go.
export const foodIcons: Record<TickerIcon, typeof Hamburger01Icon> = {
	burger: Hamburger01Icon,
	rice: RiceBowl01Icon,
	soup: SoupIcon,
	chicken: ChickenThighsIcon,
	sandwich: SandwichIcon,
	fries: FrenchFries01Icon,
	drink: DrinkIcon,
	pizza: Pizza01Icon,
	noodles: NoodlesIcon,
	coffee: Coffee01Icon,
	cake: BirthdayCakeIcon,
	icecream: IceCream01Icon
};
