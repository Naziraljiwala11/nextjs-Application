import { gql } from "@apollo/client";

export const GET_PAGES_URI = gql`
  query GetPagesURI {
    pages(first: 100) {
      nodes {
        uri
      }
    }
  }
`;

export const GET_PAGE_BY_URI = gql`
  query GetPageByURI($uri: ID!) {
    page(id: $uri, idType: URI) {
      title
      content
      slug
      date
      featuredImage {
        node {
          sourceUrl
          altText
        }
      }
    }
  }
`;

export const GET_MENU_BY_NAME = gql`
  query GetMenuByName($id: ID!, $idType: MenuNodeIdTypeEnum =NAME) {
    menu(id: $id, idType: $idType) {
      menuItems {
        nodes {
          id
          label
          uri
          parentId
          childItems {
            nodes {
              id
              label
              uri
            }
          }
        }
      }
    }
  }
`;

export const GET_POSTS = gql`
  query GetPosts {
    posts(first: 10) {
      nodes {
        id
        title
        slug
        excerpt
        date
        featuredImage {
          node {
            sourceUrl
            altText
          }
        }
      }
    }
  }
`;
