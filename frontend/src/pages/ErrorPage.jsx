import { useRouteError } from "react-router-dom";
import Header from "../components/Header";
import NotFound from "../components/errors/NotFound";
import Footer from "../components/Footer";

const ErrorRenderer = ({ error }) => {
  // render specific error components based on the error status
  switch(error.status) {
    case 404:
      return <NotFound />;
    case 401:
      return <h1>401: Unauthorized</h1>;
    case 500:
      return <h1>500: Internal Server Error</h1>;
    default:
      return <h1>Something went wrong</h1>;
  }
}

export default function ErrorPage() {
  const error = useRouteError();
  console.error(error);

  return (
    <div id="error-page">
      <Header />
      <ErrorRenderer error={error} />
      <Footer />
    </div>
  );
}