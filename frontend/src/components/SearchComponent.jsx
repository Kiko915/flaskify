import { Search } from "lucide-react";

const SearchComponent = () => {
    return (
        <form className="flaskify_search flex-1 mx-auto relative max-w-4xl flex" onSubmit={(e) => e.preventDefault()}>
            {/* Dropdown for categories */}
            <select className="border border-gray-300 rounded-l-md p-2 bg-white">
                <option value="all">All Categories</option>
                <option value="electronics">Electronics</option>
                <option value="fashion">Fashion</option>
                <option value="home">Home & Living</option>
                <option value="sports">Sports</option>
                <option value="books">Books</option>
                {/* Add more categories as needed */}
            </select>

            {/* Search Input */}
            <input
                type="text"
                placeholder='Search for products, brands and more'
                className='border border-gray-300 focus:outline-none p-2 w-full'
            />

            {/* Search Button */}
            <button
                type="submit"
                className='bg-yellow-500 text-white px-4 py-2 rounded-r-md'
            >
                <Search size={20} />
            </button>
        </form>
    );
}

export default SearchComponent;
