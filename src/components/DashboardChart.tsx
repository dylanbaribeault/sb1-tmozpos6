import React from 'react';
import { View, Dimensions, StyleSheet } from 'react-native';
import { VictoryChart, VictoryLine, VictoryTheme, VictoryAxis, VictoryArea } from 'victory-native';
import { theme } from '../theme';

interface DataPoint {
  date: string;
  count: number;
}

interface DashboardChartProps {
  data: DataPoint[];
}

const DashboardChart: React.FC<DashboardChartProps> = ({ data }) => {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <View style={styles.container}>
      <VictoryChart
        theme={VictoryTheme.material}
        domainPadding={20}
        width={Dimensions.get('window').width - 64}
        height={200}
      >
        <VictoryAxis
          tickFormat={(date) => formatDate(date)}
          style={{
            tickLabels: { fontSize: 10, padding: 5 },
          }}
        />
        <VictoryAxis
          dependentAxis
          tickFormat={(count) => count}
          style={{
            tickLabels: { fontSize: 10, padding: 5 },
          }}
        />
        <VictoryArea
          data={data}
          x="date"
          y="count"
          style={{
            data: {
              fill: `${theme.colors.primary}40`,
              stroke: theme.colors.primary,
              strokeWidth: 2,
            },
          }}
          animate={{
            duration: 500,
            onLoad: { duration: 500 },
          }}
        />
      </VictoryChart>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default DashboardChart;