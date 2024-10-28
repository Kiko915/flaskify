import { FolderOpen } from 'lucide-react';

const NoContent = () => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="rounded-full bg-gray-100 p-4 mb-4">
        <FolderOpen className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        No Content Found
      </h3>
      <p className="text-sm text-gray-500 max-w-sm">
        There&apos;s nothing here yet. Content will appear in this space once it&apos;s added.
      </p>
    </div>
  );
};

export default function UserCard({ 
  title = "Title", 
  short_description = "short_desc", 
  hasAction, 
  actionName = "Action",
  ActionIcon,  // New prop for the icon
  onAction,    // Optional click handler
  children 
}) {
  return (
    <div className="px-4">
        <div>
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="font-semibold text-xl">{title}</h2>
                <p className="font-light text-gray-600 text-sm">{short_description}</p>
              </div>
              {hasAction && (
                <button 
                  onClick={onAction}
                  className="text-sm bg-blue-900 text-white px-4 py-2 rounded hover:shadow hover:bg-blue-800 flex items-center gap-2"
                >
                  <span>{actionName}</span>
                  {ActionIcon && <ActionIcon className="w-4 h-4" />}
                </button>
              )}
            </div>
            <hr className="my-4" />
        </div>
        <div>
            {!children ? <NoContent /> : children}
        </div>
    </div>
  )
}
