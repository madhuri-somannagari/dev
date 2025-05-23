import PropTypes from "prop-types";
import {
  ErrorState,
  LoadingState,
} from "../../../shared/loading-error-state";
import InfiniteScrollTable from "./InfiniteScrollTable";
import { getErrorMessage } from "../../../../utils/util";

const Table = ({ query, data, loaderRef, title }) => (
  <>
    {query.isLoading ? (
      <LoadingState />
    ) : query.isError ? (
      <ErrorState message={getErrorMessage(query.error)} />
    ) : (
      <InfiniteScrollTable
        data={data}
        isLoading={query.isFetchingNextPage}
        loaderRef={loaderRef}
        title={title}
      />
    )}
  </>
);

export default Table;

Table.propTypes = {
  query: PropTypes.any,
  data: PropTypes.array,
  loaderRef: PropTypes.any,
  title: PropTypes.string,
};
