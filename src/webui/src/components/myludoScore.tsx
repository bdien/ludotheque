interface MyludoScoreProps {
  myludoid: number;
  score: number;
}

export function MyludoScore(props: MyludoScoreProps) {
  return (
    <a href={`https://www.myludo.fr/#!/game/${props.myludoid}`}>
      <svg xmlns="http://www.w3.org/2000/svg" width={50} height={54}>
        <defs>
          <clipPath id="a">
            <path
              d="m27.41 8.61-15.16 8.74A4.49 4.49 0 0 0 10 21.26v17.5a4.5 4.5 0 0 0 2.25 3.89l15.16 8.75a4.52 4.52 0 0 0 4.5 0l15.17-8.75a4.51 4.51 0 0 0 2.28-3.89v-17.5a4.5 4.5 0 0 0-2.24-3.89L32 8.63a4.47 4.47 0 0 0-4.59-.02Z"
              style={{
                fill: "none",
              }}
            />
          </clipPath>
        </defs>
        <path
          d="m27.41 8.61-15.16 8.74A4.49 4.49 0 0 0 10 21.26v17.5a4.5 4.5 0 0 0 2.25 3.89l15.16 8.75a4.52 4.52 0 0 0 4.5 0l15.17-8.75a4.51 4.51 0 0 0 2.28-3.89v-17.5a4.5 4.5 0 0 0-2.24-3.89L32 8.63a4.47 4.47 0 0 0-4.59-.02Z"
          style={{
            fill: "#488fcc",
          }}
        />
        <g
          style={{
            clipPath: "url(#a)",
          }}
        >
          <path
            d="m41 16.23-24 7.46a3.16 3.16 0 0 0-2.08 3.93l7.41 24a3.16 3.16 0 0 0 3.94 2.07l24-7.45a3.16 3.16 0 0 0 2.08-3.94l-7.45-24a3.17 3.17 0 0 0-3.9-2.07ZM24.22 33a3.68 3.68 0 1 1 2.39-4.62A3.69 3.69 0 0 1 24.22 33Zm10.5 5.53a3.68 3.68 0 1 1 2.39-4.62 3.69 3.69 0 0 1-2.39 4.59ZM45.21 44a3.67 3.67 0 1 1 2.39-4.61A3.69 3.69 0 0 1 45.21 44Z"
            style={{
              fill: "#fff",
              opacity: 0.25,
              isolation: "isolate",
            }}
          />
        </g>
        <text x={14} y={38} className="small" fill="#fff" fontSize="22px">
          {props.score.toFixed(1)}
        </text>
      </svg>
    </a>
  );
}
