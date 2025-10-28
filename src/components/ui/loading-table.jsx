import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './table';

const LoadingTable = ({ 
  columns = 5, 
  rows = 5, 
  className = "",
  message = "Loading..."
}) => {
  return (
    <Table className={className}>
      <TableHeader>
        <TableRow>
          {Array.from({ length: columns }).map((_, index) => (
            <TableHead key={index}>
              <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <TableRow key={rowIndex}>
            {Array.from({ length: columns }).map((_, colIndex) => (
              <TableCell key={colIndex}>
                <div className="h-4 bg-gray-100 rounded animate-pulse"></div>
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

const EmptyTable = ({ 
  columns = 5, 
  message = "No data found", 
  description = "Get started by creating your first item.",
  className = ""
}) => {
  return (
    <Table className={className}>
      <TableHeader>
        <TableRow>
          {Array.from({ length: columns }).map((_, index) => (
            <TableHead key={index}></TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell colSpan={columns} className="text-center py-12">
            <div className="flex flex-col items-center justify-center space-y-3">
              <div className="text-gray-400">
                <svg
                  className="mx-auto h-12 w-12"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <div className="text-center">
                <h3 className="text-sm font-medium text-gray-900">{message}</h3>
                <p className="text-sm text-gray-500 mt-1">{description}</p>
              </div>
            </div>
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
};

const ErrorTable = ({ 
  columns = 5, 
  message = "Something went wrong", 
  description = "There was an error loading the data. Please try again.",
  onRetry,
  className = ""
}) => {
  return (
    <Table className={className}>
      <TableHeader>
        <TableRow>
          {Array.from({ length: columns }).map((_, index) => (
            <TableHead key={index}></TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell colSpan={columns} className="text-center py-12">
            <div className="flex flex-col items-center justify-center space-y-3">
              <div className="text-red-400">
                <svg
                  className="mx-auto h-12 w-12"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <div className="text-center">
                <h3 className="text-sm font-medium text-gray-900">{message}</h3>
                <p className="text-sm text-gray-500 mt-1">{description}</p>
                {onRetry && (
                  <button
                    onClick={onRetry}
                    className="mt-3 text-sm text-blue-600 hover:text-blue-500 font-medium"
                  >
                    Try again
                  </button>
                )}
              </div>
            </div>
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
};

export { EmptyTable, ErrorTable, LoadingTable };

